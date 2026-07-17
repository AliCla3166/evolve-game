/* ============================================================================
   EVOLVE — expansion.js
   Trois systèmes ajoutés au socle, tous génériques et paramétrés par l'âge :
     1. EMPIRE (couche « O Game ») : bâtiments à files de construction avec
        TIMERS RÉELS croissants + expéditions à retour différé. C'est le levier
        de pacing pensé pour tenir ~1 an en jeu optimal.
     2. AGE OF WAR : défense en ligne temps réel (3 unités × 5 stades, tourelle,
        attaque spéciale, vagues + boss), rendu 100% procédural, re-skin par âge.
     3. PÊCHE MULTI-ÂGES : la Mare persiste à tous les âges avec un contexte
        différent (organismes → proies → esprits → héros → équipages/reliques…)
        + un Musée de civilisation qui conserve les collections des âges passés.
   Identité visuelle « dark spatial » cohérente : teinte pilotée par l'âge.
   ============================================================================ */
(function(){
'use strict';

/* ---------------------------------------------------------------------------
   THÈMES PAR ÂGE (re-skin : mêmes règles, tout autre imaginaire)
   --------------------------------------------------------------------------- */
const WAR_THEMES = {
  1:{ base:'Membrane mère', foe:'Pathogènes', boss:'Le Mégaphage', biomass:'Biomasse',
      units:['Bactérie lytique','Cyanobactérie','Archée cuirassée'], enemy:'Prion', special:'Choc osmotique' },
  2:{ base:'Tanière', foe:'Prédateurs', boss:"L'Alpha Titan", biomass:'Viande',
      units:['Meute','Cracheur de venin','Béhémoth'], enemy:'Rôdeur', special:'Cri de guerre' },
  3:{ base:'Palissade', foe:'Clans rivaux', boss:'Le Chef-Guerre', biomass:'Vivres',
      units:['Lancier','Archer','Colosse de pierre'], enemy:'Maraudeur', special:'Feu sacré' },
  4:{ base:'Château', foe:'Armée ennemie', boss:'Le Roi Noir', biomass:'Or',
      units:['Chevalier','Arbalétrier','Bélier'], enemy:'Soldat', special:'Pluie de flèches' },
  5:{ base:'Forteresse', foe:'Légions barbares', boss:'Le Général-Dieu', biomass:'Denier',
      units:['Légionnaire','Baliste','Éléphant de guerre'], enemy:'Barbare', special:'Feu grégeois' },
  6:{ base:'Bunker', foe:'Armée industrielle', boss:"Le Titan d'acier", biomass:'Acier',
      units:['Fantassin','Sniper','Char'], enemy:'Drone', special:'Frappe d\'artillerie' },
  7:{ base:'Dôme colonial', foe:'Flotte pirate', boss:'Le Dreadnought', biomass:'Énergie',
      units:['Marine','Tourelleur','Mecha'], enemy:'Raider', special:'Bombardement orbital' },
  8:{ base:'Station FTL', foe:'Essaim xéno', boss:'La Reine-Ruche', biomass:'Plasma',
      units:['Croiseur','Frégate laser','Cuirassé'], enemy:'Xéno', special:'Lance à singularité' },
  9:{ base:'Nexus', foe:'Vide dévorant', boss:"L'Archonte du Vide", biomass:'Exotique',
      units:['Avatar','Nœud psi','Léviathan'], enemy:'Ombre', special:'Effondrement psi' },
  10:{ base:'Trône céleste', foe:'Chaos primordial', boss:"L'Anti-Création", biomass:'Essence',
      units:['Séraphin','Verbe','Démiurge'], enemy:'Néant', special:'Verbe créateur' },
};

// Contexte de pêche par âge : verbe + nom de la prise + 12 noms (2 par rareté)
const FISH_THEMES = {
  1:{ pond:'La Mare primordiale', verb:'Pêcher', noun:'créature', unit:'organisme', useAge1:true },
  2:{ pond:'Le Biome', verb:'Chasser', noun:'proie', unit:'proie', shapes:['rod','beast','worm','jelly','eye','star'],
      names:['Alevin','Larve','Insecte géant','Batracien','Petit saurien','Reptile agile','Mammifère nocturne','Chasseur social','Grand fauve','Béhémoth à fourrure','Prédateur alpha','Titan des plaines'] },
  3:{ pond:'Le Cercle des esprits', verb:'Invoquer', noun:'esprit', unit:'totem', shapes:['blob','cilia','eye','jelly','spiral','star'],
      names:['Esprit du foyer','Esprit du silex','Esprit de la chasse','Ancêtre','Totem-ours','Totem-loup','Chaman rêveur','Gardien du feu','Esprit-tonnerre','Grand Esprit','Prophète des âges','Divinité tribale'] },
  4:{ pond:'La Salle des héros', verb:'Former', noun:'héros', unit:'héros', shapes:['beast','crystal','eye','sphere','star','beast'],
      names:['Écuyer','Archère','Chevalier errant','Templier','Paladin','Mage de cour','Assassin de guilde','Chevalier noir','Champion du roi','Héros légendaire','Élu de la prophétie','Roi-héros'] },
  5:{ pond:'Le Panthéon', verb:'Recruter', noun:'champion', unit:'champion', shapes:['crystal','sphere','eye','beast','star','star'],
      names:['Vélite','Archer scythe','Centurion','Prétorien','Gladiateur','Sénateur','Stratège','Général','Consul','Imperator','Demi-dieu','Divinité impériale'] },
  6:{ pond:'L\'Académie', verb:'Recruter', noun:'savant', unit:'savant', shapes:['crystal','sphere','spiral','eye','star','star'],
      names:['Ingénieur','Chimiste','Physicienne','Aviateur','Programmeuse','Nobelisé','Cyberneticien','Génie','Prix Turing','Visionnaire','Fondateur d\'IA','Esprit-monde'] },
  7:{ pond:'Le Hangar d\'exploration', verb:'Envoyer', noun:'équipage', unit:'relique', shapes:['crystal','sphere','eye','beast','star','star'],
      names:['Sonde','Rover','Équipage minier','Colon','Pilote d\'élite','Ingénieure orbitale','Relique lunaire','Artefact martien','Capitaine','Amirale','Relique ancienne','Vaisseau-monde'] },
  8:{ pond:'Le Champ d\'étoiles', verb:'Explorer', noun:'artefact', unit:'artefact', shapes:['crystal','sphere','spiral','eye','star','star'],
      names:['Balise','Astronef','Explorateur FTL','Colonie exo','Xéno-relique','Capitaine stellaire','Sphère de Dyson','Oracle stellaire','Amiral galactique','Portail vivant','Étoile domptée','Vaisseau-titan'] },
  9:{ pond:'La Toile des consciences', verb:'Capter', noun:'conscience', unit:'conscience', shapes:['spiral','eye','jelly','crystal','star','star'],
      names:['Écho','Fragment psi','Esprit-réseau','Conscience-ruche','Avatar','Oracle du vide','Méga-esprit','Archonte mineur','Chœur des mondes','Toile cosmique','Architecte','Conscience-galaxie'] },
  10:{ pond:'Le Souffle créateur', verb:'Façonner', noun:'concept', unit:'concept', shapes:['star','eye','spiral','crystal','star','star'],
      names:['Étincelle','Verbe','Souffle','Loi première','Forme pure','Lumière','Œil du cosmos','Main créatrice','Muse','Démiurge','Genèse','Absolu'] },
};

// Bâtiments (O Game) : 6 rôles génériques, re-skinnés par âge. Timers réels croissants.
const BUILD_ROLES = ['prod','energy','research','habitat','storage','yard'];
const BUILD_ICONS = { prod:'🏭', energy:'⚡', research:'🔬', habitat:'🏠', storage:'📦', yard:'🚀' };
const BUILD_THEMES = {
  1:{ prod:'Nucléole', energy:'Chaîne ATP', research:'Chromosome', habitat:'Colonie', storage:'Vacuole', yard:'Flagelle',
      exp:['Bourgeonnement','Dérive planctonique','Symbiose profonde'] },
  2:{ prod:'Terrier', energy:'Territoire de chasse', research:'Instinct', habitat:'Meute', storage:'Réserve', yard:'Migration',
      exp:['Battue','Migration saisonnière','Conquête de territoire'] },
  3:{ prod:'Foyer', energy:'Feu sacré', research:'Hutte du chaman', habitat:'Campement', storage:'Grenier', yard:'Expédition',
      exp:['Chasse au mammouth','Pèlerinage','Razzia'] },
  4:{ prod:'Ferme', energy:'Moulin', research:'Monastère', habitat:'Bourg', storage:'Entrepôt', yard:'Port',
      exp:['Croisade','Route de la soie','Quête du Graal'] },
  5:{ prod:'Latifundium', energy:'Aqueduc', research:'Bibliothèque', habitat:'Cité', storage:'Horreum', yard:'Voie triomphale',
      exp:['Campagne militaire','Ambassade','Grande conquête'] },
  6:{ prod:'Usine', energy:'Centrale', research:'Laboratoire', habitat:'Métropole', storage:'Silo', yard:'Aéroport',
      exp:['Expédition polaire','Mission scientifique','Course à l\'espace'] },
  7:{ prod:'Extracteur', energy:'Réacteur à fusion', research:'Centre R&D', habitat:'Dôme colonial', storage:'Dépôt orbital', yard:'Astroport',
      exp:['Mine d\'astéroïde','Terraformation','Exploration lunaire'] },
  8:{ prod:'Forge stellaire', energy:'Sphère de Dyson', research:'Institut FTL', habitat:'Vaisseau-monde', storage:'Soute à plasma', yard:'Portail FTL',
      exp:['Saut interstellaire','Premier contact','Colonisation d\'exoplanète'] },
  9:{ prod:'Mine du vide', energy:'Cœur galactique', research:'Nexus de savoir', habitat:'Amas habité', storage:'Réservoir exotique', yard:'Trou de ver',
      exp:['Traversée intergalactique','Fusion de consciences','Méga-structure'] },
  10:{ prod:'Autel de création', energy:'Source primordiale', research:'Œil omniscient', habitat:'Cosmos-corps', storage:'Réserve d\'Essence', yard:'Spirale infinie',
      exp:['Genèse d\'un monde','Cycle cosmique','Nouveau Big Bang'] },
};

/* Helpers d'âge */
function hasState(){ return typeof state !== 'undefined' && state; }
function A(){ return (hasState() && state.ageId) || 1; }
function ageHue(){ try { return curAge().hue; } catch(e){ return 168; } }
function thr(){ try { return ageThreshold(); } catch(e){ return 1000; } }
function grantAP(n){ if (typeof addAgePoints==='function') addAgePoints(n); else state.agePoints=(state.agePoints||0)+n; }

/* ============================================================================
   1) EMPIRE — bâtiments (files + timers réels) & expéditions (retour différé)
   ============================================================================ */
const Empire = (() => {
  // Coût & temps de construction croissants — le temps est le vrai frein « O Game ».
  function bDef(role, age){
    const th = BUILD_THEMES[age] || BUILD_THEMES[1];
    // base scaling : plus l'âge est avancé, plus c'est cher et long
    const ageMul = Math.pow(3.2, age-1);
    return {
      role, name: th[role], icon: BUILD_ICONS[role],
      baseCostDna: ({prod:200, energy:600, research:1500, habitat:4000, storage:1200, yard:8000})[role] * ageMul,
      costMult: 1.6,
      baseTimeS: ({prod:30, energy:75, research:150, habitat:300, storage:120, yard:600})[role] * Math.pow(1.9, age-1),
      timeMult: 1.55,
      desc: ({
        prod:'Augmente la production de ressources de +12%/niveau.',
        energy:'Alimente l\'ensemble : +8% production globale/niveau.',
        research:'Réduit les temps de construction de -6%/niveau (min 40%).',
        habitat:'+1 expédition simultanée tous les 2 niveaux.',
        storage:'Augmente le plafond de production hors-ligne (+4h/niveau).',
        yard:'Débloque et accélère les expéditions (+15% butin/niveau).',
      })[role],
    };
  }
  function ensure(){
    if (!state.empire) state.empire = { b:{}, queue:null, exped:[], rushed:0 };
    if (!state.empire.b) state.empire.b = {};
    if (!('queue' in state.empire)) state.empire.queue = null;
    if (!state.empire.exped) state.empire.exped = [];
  }
  function lvl(role){ ensure(); return (state.empire.b[role]||0); }
  function researchFactor(){ return Math.max(0.40, 1 - 0.06*lvl('research')); }
  function costOf(role){ const d=bDef(role,A()); return Math.ceil(d.baseCostDna * Math.pow(d.costMult, lvl(role))); }
  function timeOf(role){ const d=bDef(role,A()); return Math.max(3, d.baseTimeS * Math.pow(d.timeMult, lvl(role)) * researchFactor()); }
  function expedSlots(){ return 1 + Math.floor(lvl('habitat')/2); }

  // Multiplicateur de production injecté dans computeMultipliers via un hook global
  function prodMult(){ ensure(); return (1 + 0.12*lvl('prod')) * (1 + 0.08*lvl('energy')); }
  window.empireProdMult = prodMult;

  function canBuild(role){ ensure(); return !state.empire.queue && (state.dna||0) >= costOf(role); }
  function startBuild(role){
    ensure(); if (!canBuild(role)) return false;
    state.dna -= costOf(role);
    state.empire.queue = { role, endsAt: Date.now() + timeOf(role)*1000, level: lvl(role)+1, total: timeOf(role)*1000 };
    return true;
  }
  function rushBuild(){
    ensure(); const q=state.empire.queue; if (!q) return false;
    const remainingS = Math.max(0,(q.endsAt-Date.now())/1000);
    const cost = Math.ceil(remainingS/60) * 3;  // 3 PB par minute restante
    if ((state.pb||0) < cost) return false;
    state.pb -= cost; q.endsAt = Date.now(); state.empire.rushed++;
    processQueue();
    return true;
  }
  function processQueue(){
    ensure(); const q=state.empire.queue; if (!q) return;
    if (Date.now() >= q.endsAt){
      state.empire.b[q.role] = q.level;
      state.empire.queue = null;
      if (typeof toast==='function') toast(`🏗️ <b>${bDef(q.role,A()).name}</b> niveau ${q.level} terminé`, 'good');
    }
  }
  // Expéditions
  const EXP_DURS = [ {label:'15 min', s:900, mul:1}, {label:'1 h', s:3600, mul:4.5}, {label:'8 h', s:28800, mul:42}, {label:'24 h', s:86400, mul:150} ];
  function launchExped(idx, durIdx){
    ensure();
    if (state.empire.exped.length >= expedSlots()) return false;
    const d = EXP_DURS[durIdx]; if (!d) return false;
    state.empire.exped.push({ idx, name:(BUILD_THEMES[A()]||BUILD_THEMES[1]).exp[idx], endsAt: Date.now()+d.s*1000, total:d.s*1000, mul:d.mul });
    return true;
  }
  function collectExped(i){
    ensure(); const e=state.empire.exped[i]; if (!e || Date.now()<e.endsAt) return null;
    const yard = 1 + 0.15*lvl('yard');
    const base = 40 * Math.pow(2.6, A()-1) * e.mul * yard;
    const dna = base * (6 + Math.random()*8);
    const pb = Math.max(1, Math.round(base*0.05*(0.6+Math.random())));
    const ap = Math.max(1, Math.round(0.6 * e.mul * (0.7+Math.random()*0.6)));
    if (typeof addDna==='function') addDna(dna);
    if (typeof addPb==='function') addPb(pb);
    grantAP(ap);
    // Chance de relique de musée
    let relic=null;
    if (Math.random() < 0.25 && window.Museum) relic = Museum.grantRelic();
    state.empire.exped.splice(i,1);
    return { dna, pb, ap, relic };
  }
  function tick(){
    ensure(); processQueue();
    // les expéditions sont collectées manuellement (voyant), rien à faire ici sauf refresh UI
  }
  function offlineCatchUp(){ ensure(); processQueue(); }

  return { ensure, bDef, lvl, costOf, timeOf, canBuild, startBuild, rushBuild, processQueue,
           expedSlots, EXP_DURS, launchExped, collectExped, tick, offlineCatchUp, prodMult, researchFactor };
})();
window.Empire = Empire;

/* ============================================================================
   2) MUSÉE DE CIVILISATION — conserve les prises de tous les âges
   ============================================================================ */
const Museum = (() => {
  function ensure(){ if (!state.museum) state.museum = { relics:0, byAge:{} }; if(!state.museum.byAge) state.museum.byAge={}; }
  // marque une prise dans le musée de l'âge courant
  function record(age, id){ ensure(); (state.museum.byAge[age] = state.museum.byAge[age]||{})[id]=true; }
  function countAge(age){ ensure(); return Object.keys(state.museum.byAge[age]||{}).length; }
  function grantRelic(){ ensure(); state.museum.relics++; return true; }
  // bonus permanent : +2% production globale par famille (âge) dont la collection est complète
  function completedAges(){ ensure(); let n=0; for (let a=1;a<=10;a++){ const pool=window.fishPoolFor?fishPoolFor(a):null; if (pool && pool.length && pool.every(c=>state.museum.byAge[a]&&state.museum.byAge[a][c.id])) n++; } return n; }
  function bonusMult(){ return 1 + 0.02*completedAges() + 0.005*(state.museum?.relics||0); }
  window.museumProdMult = bonusMult;
  return { ensure, record, countAge, grantRelic, completedAges, bonusMult };
})();
window.Museum = Museum;

/* ============================================================================
   3) POOLS DE PÊCHE PAR ÂGE (générés depuis les thèmes, rareté = index)
   ============================================================================ */
const _agePools = {};
function fishPoolFor(age){
  if (age === 1 && typeof CREATURES !== 'undefined') return CREATURES;  // pool historique conservé
  if (_agePools[age]) return _agePools[age];
  const th = FISH_THEMES[age] || FISH_THEMES[2];
  const baseHue = (typeof AGES!=='undefined' && AGES[age-1]) ? AGES[age-1].hue : 200;
  const vals = [1.0,1.2,1.5,2.0,3.2,6.0];
  const pool = [];
  (th.names||[]).forEach((nm, i) => {
    const r = Math.min(5, Math.floor(i/2));           // 2 par rareté → 12
    const shape = (th.shapes && th.shapes[r]) || 'blob';
    pool.push({ id:`a${age}_${i}`, name:nm, r, hue:(baseHue + i*14)%360, shape, val:vals[r]*(1+(i%2)*0.05) });
  });
  _agePools[age] = pool;
  return pool;
}
window.fishPoolFor = fishPoolFor;
function POOL(){ return fishPoolFor(A()); }
window.POOL = POOL;
window.FISH_THEME = function(){ return FISH_THEMES[A()] || FISH_THEMES[1]; };
function findCreatureAny(id){
  for (let a=1;a<=10;a++){ const p=fishPoolFor(a); const c=p.find(x=>x.id===id); if(c) return c; }
  if (typeof CREATURES!=='undefined'){ const c=CREATURES.find(x=>x.id===id); if(c) return c; }
  return null;
}
window.findCreatureAny = findCreatureAny;

/* ============================================================================
   INJECTION CSS (identité dark spatial, teinte pilotée par --ah = hue d'âge)
   ============================================================================ */
function injectStyle(){
  if (document.getElementById('expansion-style')) return;
  const s = document.createElement('style'); s.id='expansion-style';
  s.textContent = `
  :root{ --ah:168; }
  .xp-nav-extra{display:flex;gap:6px;margin:0 0 10px}
  .emp-intro,.war-intro,.mus-intro{font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:12px}
  .emp-b{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px;margin-bottom:8px}
  .emp-b.aff{border-color:rgba(62,230,196,.4)}
  .emp-ic{width:44px;height:44px;display:grid;place-items:center;font-size:24px;background:hsla(var(--ah),70%,50%,.10);border-radius:10px;flex-shrink:0}
  .emp-main{flex:1;min-width:0}
  .emp-name{font-weight:700;font-size:14px}
  .emp-lvl{font-size:11px;color:var(--accent);font-weight:700;margin-left:6px}
  .emp-desc{font-size:11px;color:var(--muted);line-height:1.4;margin:2px 0 4px}
  .emp-meta{font-size:11px;color:var(--gold)}
  .emp-buy{background:hsla(var(--ah),70%,45%,.18);border:1px solid hsla(var(--ah),70%,55%,.5);border-radius:10px;padding:8px 10px;font-weight:700;font-size:12px;color:var(--txt);white-space:nowrap}
  .emp-buy:disabled{opacity:.4}
  .emp-queue{background:var(--card2);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:12px}
  .emp-q-bar{height:10px;border-radius:999px;background:rgba(3,12,20,.7);overflow:hidden;margin:8px 0}
  .emp-q-fill{height:100%;background:linear-gradient(90deg,var(--accent),#fff2c2);width:0;transition:width .5s}
  .emp-rush{background:rgba(143,208,255,.16);border:1px solid rgba(143,208,255,.4);border-radius:9px;padding:6px 10px;font-size:12px;font-weight:700}
  .emp-section-t{font-weight:800;font-size:13px;margin:14px 0 8px;color:var(--accent)}
  .exp-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px;margin-bottom:8px}
  .exp-name{font-weight:700;font-size:13px;margin-bottom:6px}
  .exp-durs{display:flex;gap:6px;flex-wrap:wrap}
  .exp-dur{background:hsla(var(--ah),70%,45%,.14);border:1px solid var(--line);border-radius:9px;padding:6px 9px;font-size:11px;font-weight:700}
  .exp-run{display:flex;align-items:center;gap:10px;background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:8px}
  .exp-run.done{border-color:rgba(255,224,138,.6);box-shadow:0 0 14px rgba(255,224,138,.15)}
  .exp-run-bar{flex:1;height:8px;border-radius:999px;background:rgba(3,12,20,.7);overflow:hidden}
  .exp-run-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--gold));width:0}
  .exp-collect{background:linear-gradient(90deg,var(--gold),#fff2c2);color:#1a1205;border-radius:9px;padding:7px 12px;font-weight:800;font-size:12px}
  /* voyants nav */
  #bottom-nav .bnav-btn .bnav-dot{display:none}
  .bnav-btn.has-alert .bnav-dot{display:block}
  /* Musée */
  .mus-age{margin-bottom:14px}
  .mus-age-h{font-weight:800;font-size:13px;color:var(--accent);margin-bottom:6px;display:flex;justify-content:space-between}
  .mus-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:6px}
  .mus-cell{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px 4px;text-align:center}
  .mus-cell.got{border-color:hsla(var(--ah),70%,55%,.5)}
  .mus-cell.locked{opacity:.35}
  .mus-th{width:100%;aspect-ratio:1;border-radius:8px}
  .mus-nm{font-size:9px;margin-top:3px;line-height:1.1}
  /* WAR modal */
  /* La modale War est nichee dans .modal-box, qui par defaut est plafonnee a 520px/88vh
     (taille d'un dialogue normal) : sans cette regle plus specifique, les boutons de niveau
     et "Lancer" (positionnes en bas de #war-wrap, qui se croit sur 100vh) tombaient hors de
     la zone visible et cliquable de la boite, quel que soit l'ecran (bug "Guerre ne fait rien").
     100dvh (dynamic viewport height) evite en plus le piege classique mobile ou 100vh inclut
     la zone cachee sous la barre d'adresse du navigateur. */
  #war-modal .modal-box{padding:0;overflow:hidden;border-radius:0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;height:100dvh;max-height:100dvh}
  #war-wrap{position:relative;width:100%;height:100%;max-height:100%}
  #war-canvas{display:block;width:100%;height:100%;touch-action:none}
  .war-top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;z-index:5;background:linear-gradient(180deg,rgba(2,8,20,.85),transparent)}
  .war-top h3{font-size:14px;font-weight:800}
  .war-top .war-x{margin-left:auto;background:var(--card);border:1px solid var(--line);border-radius:999px;width:34px;height:34px;font-size:16px}
  .war-stat{font-size:12px;font-weight:700;color:var(--gold)}
  .war-controls{position:absolute;left:0;right:0;bottom:0;display:flex;gap:6px;padding:8px calc(8px + env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) calc(8px + env(safe-area-inset-left));z-index:5;background:linear-gradient(0deg,rgba(2,8,20,.9),transparent)}
  .war-btn{flex:1;min-width:0;background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:8px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;font-weight:700;color:var(--txt)}
  .war-btn:disabled{opacity:.4}
  .war-btn .wb-ic{font-size:18px}
  .war-btn .wb-cost{font-size:9px;color:var(--gold)}
  .war-btn.special{border-color:rgba(255,139,208,.5)}
  .war-levels{display:flex;gap:8px;flex-wrap:wrap}
  .war-lvl{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:12px;font-weight:700}
  .war-lvl.done{border-color:rgba(62,230,196,.5);color:var(--accent)}
  .war-lvl.locked{opacity:.4}
  .war-lvl.boss{border-color:rgba(255,139,208,.5)}
  .war-launch{background:linear-gradient(90deg,hsla(var(--ah),70%,50%,.9),hsla(var(--ah),80%,60%,.9));border-radius:12px;padding:12px;font-weight:800;width:100%;margin-top:6px;color:#04121a}
  .war-end{position:absolute;inset:0;display:grid;place-items:center;z-index:8;background:rgba(2,8,20,.82);backdrop-filter:blur(3px)}
  /* Meme piege que #dev-mode-badge : .war-end fixe son propre "display", ce qui bat la regle
     navigateur [hidden]{display:none} (specificite egale, mais l'auteur gagne sur l'agent
     utilisateur) : sans cette ligne, ce panneau de fin de combat restait TOUJOURS affiche
     (vide, tant qu'aucun combat n'est termine) par-dessus toute la modale Guerre, en
     bloquant tous les clics (niveaux, bouton Lancer, unites...). C'etait la vraie cause du
     "clique sur Guerre, rien ne se passe". */
  #war-end[hidden]{display:none}
  .war-end-box{background:var(--card2);border:1px solid var(--line);border-radius:18px;padding:22px;text-align:center;width:min(360px,90vw)}
  .war-end-box h2{font-size:22px;margin-bottom:8px}
  .mg-play{background:linear-gradient(90deg,hsla(var(--ah),70%,50%,.9),hsla(var(--ah),80%,60%,.9));border-radius:10px;padding:9px 12px;font-weight:800;color:#04121a}
  `;
  document.head.appendChild(s);
}
function refreshHue(){ document.documentElement.style.setProperty('--ah', ageHue()); }

/* ============================================================================
   DOM : ajoute les panneaux Empire & Musée + boutons de nav + modale War
   ============================================================================ */
function injectDom(){
  // Panneaux dans la zone .panels
  const panels = document.querySelector('.panels');
  if (panels && !document.getElementById('panel-empire-wrap')){
    const emp = document.createElement('div');
    emp.className='panel'; emp.id='panel-empire-wrap';
    emp.innerHTML = `<div class="panel-head"><h2>🏛️ Empire</h2></div><div id="panel-empire"></div>`;
    panels.appendChild(emp);
    const mus = document.createElement('div');
    mus.className='panel'; mus.id='panel-museum-wrap';
    mus.innerHTML = `<div class="panel-head"><h2>🏛️ Musée</h2></div><div id="panel-museum"></div>`;
    panels.appendChild(mus);
  }
  // Boutons bottom-nav (Empire, Guerre) + side nav
  const bnav = document.getElementById('bottom-nav');
  if (bnav && !bnav.querySelector('[data-panel="empire"]')){
    const bEmp = document.createElement('button');
    bEmp.className='bnav-btn'; bEmp.dataset.panel='empire';
    bEmp.innerHTML=`🏛️<span>Empire</span><span class="bnav-dot"></span>`;
    const bWar = document.createElement('button');
    bWar.className='bnav-btn'; bWar.dataset.war='1';
    bWar.innerHTML=`⚔️<span>Guerre</span>`;
    // insère après "Mini-jeux"
    bnav.appendChild(bEmp); bnav.appendChild(bWar);
    bEmp.addEventListener('click', ()=>{ openPanel('empire'); });
    bWar.addEventListener('click', ()=>{ War.open(); });
  }
  const nav = document.getElementById('nav');
  if (nav && !nav.querySelector('[data-panel="empire"]')){
    const n1=document.createElement('button'); n1.className='nav-btn'; n1.dataset.panel='empire'; n1.textContent='🏛️ Empire';
    const n2=document.createElement('button'); n2.className='nav-btn'; n2.dataset.panel='museum'; n2.textContent='🏛️ Musée';
    nav.appendChild(n1); nav.appendChild(n2);
    n1.addEventListener('click', ()=>openPanel('empire'));
    n2.addEventListener('click', ()=>openPanel('museum'));
  }
  // enregistre les titres de panneaux
  if (typeof PANEL_TITLES !== 'undefined'){ PANEL_TITLES.empire='🏛️ Empire'; PANEL_TITLES.museum='🏛️ Musée de civilisation'; }

  // Modale Age of War
  if (!document.getElementById('war-modal')){
    const m=document.createElement('div'); m.id='war-modal'; m.className='modal fullscreen';
    m.innerHTML=`<div class="modal-box"><div id="war-wrap">
      <div class="war-top">
        <h3 id="war-title">⚔️ Guerre</h3>
        <span class="war-stat" id="war-biomass"></span>
        <span class="war-stat" id="war-xp"></span>
        <button class="war-x" id="war-close">✕</button>
      </div>
      <canvas id="war-canvas"></canvas>
      <div class="war-controls" id="war-controls"></div>
      <div class="war-end" id="war-end" hidden><div class="war-end-box" id="war-end-box"></div></div>
    </div></div>`;
    document.body.appendChild(m);
  }
}
function openPanel(key){
  if (typeof openSidePanel==='function'){ openSidePanel(key); }
  else { document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id==='panel-'+key+'-wrap')); document.getElementById('side').classList.add('open'); }
  if (key==='empire') renderEmpire();
  if (key==='museum') renderMuseum();
}

/* ============================================================================
   RENDU — Empire
   ============================================================================ */
function fmtDur(s){ s=Math.max(0,Math.floor(s)); const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),ss=s%60;
  if(d)return `${d}j ${h}h`; if(h)return `${h}h ${m}m`; if(m)return `${m}m ${ss}s`; return `${ss}s`; }

function renderEmpire(){
  const el=document.getElementById('panel-empire'); if(!el) return;
  Empire.ensure(); const age=A();
  let html=`<div class="emp-intro">Ta civilisation se bâtit en <b>temps réel</b> : chaque bâtiment prend du temps à construire (de quelques secondes aux premiers âges à plusieurs jours aux âges avancés). Tes 💠 Points Bonus (habitudes réelles) peuvent <b>accélérer</b> une construction. Les <b>expéditions</b> partent puis reviennent chargées de butin — reviens les récolter.</div>`;
  // File en cours
  const q=state.empire.queue;
  if (q){
    const prog=Math.min(1,1-(q.endsAt-Date.now())/q.total);
    const remain=(q.endsAt-Date.now())/1000;
    const d=Empire.bDef(q.role,age);
    const rushCost=Math.ceil(Math.max(0,remain)/60)*3;
    html+=`<div class="emp-queue"><b>🏗️ ${d.icon} ${d.name} → niv. ${q.level}</b>
      <div class="emp-q-bar"><div class="emp-q-fill" style="width:${(prog*100).toFixed(1)}%"></div></div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span class="emp-desc" style="margin:0">⏳ ${fmtDur(remain)} restant</span>
        <button class="emp-rush" id="emp-rush" ${(state.pb||0)>=rushCost?'':'disabled'}>⚡ Terminer · 💠 ${rushCost}</button>
      </div></div>`;
  }
  // Bâtiments
  html+=`<div class="emp-section-t">🏗️ Bâtiments</div>`;
  for (const role of BUILD_ROLES){
    const d=Empire.bDef(role,age), L=Empire.lvl(role), cost=Empire.costOf(role), time=Empire.timeOf(role);
    const can=Empire.canBuild(role);
    html+=`<div class="emp-b ${can?'aff':''}">
      <div class="emp-ic">${d.icon}</div>
      <div class="emp-main">
        <div class="emp-name">${d.name}<span class="emp-lvl">niv. ${L}</span></div>
        <div class="emp-desc">${d.desc}</div>
        <div class="emp-meta">⏳ ${fmtDur(time)} · 🧬 ${fmt(cost)}</div>
      </div>
      <button class="emp-buy" data-build="${role}" ${can?'':'disabled'}>Construire</button>
    </div>`;
  }
  // Expéditions
  const th=BUILD_THEMES[age]||BUILD_THEMES[1];
  html+=`<div class="emp-section-t">🚀 Expéditions <span class="emp-desc" style="margin:0">(${state.empire.exped.length}/${Empire.expedSlots()} en cours)</span></div>`;
  state.empire.exped.forEach((e,i)=>{
    const done=Date.now()>=e.endsAt; const prog=Math.min(1,1-(e.endsAt-Date.now())/e.total);
    html+=`<div class="exp-run ${done?'done':''}">
      <div style="flex:1;min-width:0"><div class="exp-name" style="margin:0">${e.name}</div>
      ${done?'<div class="emp-meta">✅ De retour !</div>':`<div class="exp-run-bar"><div class="exp-run-fill" style="width:${(prog*100).toFixed(1)}%"></div></div><div class="emp-desc" style="margin:2px 0 0">${fmtDur((e.endsAt-Date.now())/1000)}</div>`}</div>
      ${done?`<button class="exp-collect" data-collect="${i}">Récolter</button>`:''}
    </div>`;
  });
  if (state.empire.exped.length < Empire.expedSlots()){
    th.exp.forEach((name,idx)=>{
      html+=`<div class="exp-card"><div class="exp-name">${name}</div><div class="exp-durs">`;
      Empire.EXP_DURS.forEach((d,di)=>{ html+=`<button class="exp-dur" data-exp="${idx}" data-dur="${di}">${d.label}</button>`; });
      html+=`</div></div>`;
    });
  }
  el.innerHTML=html;
}

function renderMuseum(){
  const el=document.getElementById('panel-museum'); if(!el) return;
  Museum.ensure();
  const done=Museum.completedAges();
  let html=`<div class="mus-intro">Le musée conserve <b>toutes tes prises</b>, âge après âge — ton héritage vivant. Chaque famille (âge) complétée donne <b>+2% de production permanente</b> ; les reliques rapportées par expédition ajoutent un petit bonus. Familles complètes : <b>${done}/10</b> · Reliques : <b>${state.museum.relics||0}</b>.</div>`;
  for (let a=1;a<=Math.max(A(),1);a++){
    const pool=fishPoolFor(a); if(!pool||!pool.length) continue;
    const ageName=(AGES[a-1]||{}).name||('Âge '+a);
    const got=Museum.countAge(a);
    html+=`<div class="mus-age"><div class="mus-age-h"><span>Âge ${a} · ${ageName}</span><span>${got}/${pool.length}</span></div><div class="mus-grid">`;
    for (const c of pool){
      const has=state.museum.byAge[a] && state.museum.byAge[a][c.id];
      html+=`<div class="mus-cell ${has?'got':'locked'}">${has?`<img class="mus-th" src="${creatureThumb(c)}" alt="">`:`<div class="mus-th" style="display:grid;place-items:center;color:var(--muted)">?</div>`}<div class="mus-nm">${has?c.name:'???'}</div></div>`;
    }
    html+=`</div></div>`;
  }
  el.innerHTML=html;
}

/* Interactions Empire (délégation) */
function bindEmpire(){
  const p=document.getElementById('panel-empire'); if(!p) return;
  p.addEventListener('click', e=>{
    const b=e.target.closest('[data-build]');
    if (b){ if(Empire.startBuild(b.dataset.build)){ renderEmpire(); if(typeof renderHud==='function')renderHud(); } else if(typeof toast==='function') toast('Une construction est déjà en cours ou ADN insuffisant.','bad'); return; }
    if (e.target.closest('#emp-rush')){ if(Empire.rushBuild()){ renderEmpire(); renderHud(); toast('⚡ Construction terminée','good'); } return; }
    const ex=e.target.closest('[data-exp]');
    if (ex){ if(Empire.launchExped(parseInt(ex.dataset.exp),parseInt(ex.dataset.dur))){ renderEmpire(); toast('🚀 Expédition lancée','good'); } else toast('Plus de créneau d\'expédition (améliore l\'Habitat).','bad'); return; }
    const col=e.target.closest('[data-collect]');
    if (col){ const r=Empire.collectExped(parseInt(col.dataset.collect)); if(r){ let msg=`🚀 Retour : +${fmt(r.dna)} 🧬 · +${r.pb} 💠 · +${r.ap} ⭐`; if(r.relic) msg+=' · 🏺 relique !'; toast(msg,'good'); renderEmpire(); renderHud(); } return; }
  });
}

/* voyant nav Empire (expédition prête / rien en file) */
function empireAlert(){
  Empire.ensure();
  const btn=document.querySelector('#bottom-nav [data-panel="empire"]');
  if(!btn) return;
  const expedReady = state.empire.exped.some(e=>Date.now()>=e.endsAt);
  const idle = !state.empire.queue;
  btn.classList.toggle('has-alert', expedReady);
}

/* ============================================================================
   AGE OF WAR — défense en ligne temps réel, rendu procédural, re-skin par âge
   ============================================================================ */
const War = (() => {
  let cv, ctx, W=0, H=0, dpr=1, raf=0, running=false, last=0;
  let sim=null;               // état de bataille en cours (non sauvegardé)
  const LANE_Y=0.62;          // ligne de combat (fraction de hauteur)
  const NLEVELS=10;

  function ensure(){ if(!state.war) state.war={ cleared:{}, xpTotal:0 }; if(!state.war.cleared) state.war.cleared={}; }
  function clearedCount(age){ ensure(); return Object.keys(state.war.cleared[age]||{}).length; }
  function isCleared(age,lvl){ ensure(); return !!(state.war.cleared[age]&&state.war.cleared[age][lvl]); }
  function markCleared(age,lvl){ ensure(); (state.war.cleared[age]=state.war.cleared[age]||{})[lvl]=true; }
  function maxUnlocked(age){ ensure(); let m=1; for(let l=1;l<=NLEVELS;l++){ if(isCleared(age,l)) m=Math.max(m,l+1); } return Math.min(NLEVELS,m); }

  // stats de base des 3 archétypes, mises à l'échelle par le stade d'évolution
  const ARCH=[
    { key:0, role:'Assaut',   cost:14, hp:52,  dmg:9,  range:0.02, speed:0.055, atk:0.6, col:'#3EE6C4' },
    { key:1, role:'Tireur',   cost:22, hp:30,  dmg:7,  range:0.16, speed:0.045, atk:0.9, col:'#8fd0ff' },
    { key:2, role:'Colosse',  cost:46, hp:170, dmg:16, range:0.02, speed:0.032, atk:1.1, col:'#ffcf5c' },
  ];
  function stageMul(stage){ return Math.pow(1.7, stage); }   // stade 0..4

  function open(){
    ensure(); injectStyle(); refreshHue();
    document.getElementById('war-modal').classList.add('visible');
    renderLevelSelect();
  }
  function close(){
    running=false; cancelAnimationFrame(raf);
    document.getElementById('war-modal').classList.remove('visible');
    if (typeof saveGame==='function') saveGame();
    if (typeof renderHud==='function') renderHud();
  }

  function renderLevelSelect(){
    const age=A(), th=WAR_THEMES[age]||WAR_THEMES[1];
    document.getElementById('war-title').textContent=`⚔️ ${th.base} — ${curAge().name}`;
    document.getElementById('war-biomass').textContent='';
    document.getElementById('war-xp').textContent=`⭐ ${fmt(state.agePoints||0)}/${fmt(thr())}`;
    const ctr=document.getElementById('war-controls');
    const maxU=maxUnlocked(age);
    let html=`<div style="width:100%"><div class="war-intro">Défends ta <b>${th.base}</b> contre ${th.foe}. Produis 3 types d'unités, fais-les <b>évoluer</b> (5 stades), utilise ta tourelle et ton attaque spéciale « ${th.special} ». Chaque niveau vaincu <b>pour la première fois</b> rapporte des ⭐ Points d'Âge. Niveau 10 = <b>${th.boss}</b>.</div><div class="war-levels">`;
    for (let l=1;l<=NLEVELS;l++){
      const done=isCleared(age,l), locked=l>maxU, boss=(l===NLEVELS);
      html+=`<button class="war-lvl ${done?'done':''} ${locked?'locked':''} ${boss?'boss':''}" data-lvl="${l}" ${locked?'disabled':''}>${boss?'👑 ':''}Niv. ${l}${done?' ✔':''}</button>`;
    }
    html+=`</div><button class="war-launch" id="war-launch" data-lvl="${maxU}">▶ Lancer le niveau ${maxU}${maxU===NLEVELS?' — '+th.boss:''}</button></div>`;
    ctr.innerHTML=html;
    document.getElementById('war-end').hidden=true;
    // canvas montre l'aperçu statique
    setupCanvas(); drawIdle();
    ctr.querySelectorAll('[data-lvl]').forEach(b=>b.addEventListener('click',()=>{
      const l=parseInt(b.dataset.lvl); if(l>maxU) return;
      const btn=document.getElementById('war-launch'); btn.dataset.lvl=l; btn.textContent=`▶ Lancer le niveau ${l}${l===NLEVELS?' — '+(WAR_THEMES[age]||WAR_THEMES[1]).boss:''}`;
    }));
    document.getElementById('war-launch').addEventListener('click',()=>startBattle(parseInt(document.getElementById('war-launch').dataset.lvl)));
  }

  function setupCanvas(){
    cv=document.getElementById('war-canvas'); ctx=cv.getContext('2d');
    dpr=window.devicePixelRatio||1;
    const r=cv.parentElement.getBoundingClientRect();
    W=cv.width=r.width*dpr; H=cv.height=r.height*dpr;
    cv.style.width=r.width+'px'; cv.style.height=r.height+'px';
  }

  function startBattle(level){
    const age=A(), th=WAR_THEMES[age]||WAR_THEMES[1];
    setupCanvas();
    const diff=Math.pow(1.35, level-1)*Math.pow(1.9, age-1);
    sim={
      age, level, th, boss:(level===NLEVELS),
      biomass:70, biomassRate:9+level*0.6, xp:0, stage:0,
      baseHp:200, baseMax:200, enemyHp:220*diff, enemyMax:220*diff,
      units:[], enemies:[], projectiles:[], fx:[],
      spawnCd:0, waveT:0, waveN:0, diff, turretCd:0, specialCd:0, specialReady:0,
      over:false, won:false, bossSpawned:false, t:0,
      // stats ennemi mis à l'échelle
      eStat:{ hp:34*diff, dmg:6*diff, speed:0.05, atk:0.8 },
    };
    document.getElementById('war-end').hidden=true;
    renderBattleControls();
    running=true; last=performance.now(); loop();
  }

  function renderBattleControls(){
    const th=sim.th;
    const ctr=document.getElementById('war-controls');
    let html='';
    ARCH.forEach((a,i)=>{
      html+=`<button class="war-btn" data-spawn="${i}"><span class="wb-ic">${['🦠','🎯','🛡️'][i]}</span><span>${th.units[i]}</span><span class="wb-cost" id="wb-cost-${i}">${a.cost}</span></button>`;
    });
    html+=`<button class="war-btn" data-evolve="1"><span class="wb-ic">🧬</span><span>Évoluer</span><span class="wb-cost" id="wb-evo">—</span></button>`;
    html+=`<button class="war-btn special" data-special="1"><span class="wb-ic">💥</span><span>${th.special}</span><span class="wb-cost" id="wb-spec">…</span></button>`;
    ctr.innerHTML=html;
    ctr.querySelectorAll('[data-spawn]').forEach(b=>b.addEventListener('click',()=>spawnUnit(parseInt(b.dataset.spawn))));
    ctr.querySelector('[data-evolve]').addEventListener('click',evolve);
    ctr.querySelector('[data-special]').addEventListener('click',special);
  }

  function evoCost(){ return 120*Math.pow(2.4, sim.stage); }
  function spawnUnit(i){
    if(!sim||sim.over) return;
    const a=ARCH[i]; const cost=Math.ceil(a.cost*Math.pow(1.15, countUnits(i)));
    if (sim.biomass<cost) return;
    sim.biomass-=cost;
    const sm=stageMul(sim.stage);
    sim.units.push({ i, x:0.06, hp:a.hp*sm, maxhp:a.hp*sm, dmg:a.dmg*sm, range:a.range, speed:a.speed, atk:a.atk, cd:0, col:a.col, stage:sim.stage, phase:Math.random()*6 });
  }
  function countUnits(i){ return sim.units.filter(u=>u.i===i).length; }
  function evolve(){ if(!sim||sim.over) return; if(sim.stage>=4) return; const c=evoCost(); if(sim.xp<c) return; sim.xp-=c; sim.stage++; addFx(0.06,LANE_Y,'evolve'); }
  function special(){ if(!sim||sim.over) return; if(sim.specialReady>Date.now()) return; sim.specialReady=Date.now()+18000;
    // AoE : dégâts massifs à tous les ennemis à l'écran
    const dmg=40*sim.diff*(1+sim.stage*0.5);
    sim.enemies.forEach(e=>{ e.hp-=dmg; addFx(e.x,LANE_Y,'blast'); });
    sim.enemyHp-=dmg*0.5;
    addFx(0.5,LANE_Y-0.2,'special');
  }

  function addFx(x,y,kind){ sim.fx.push({x,y,kind,t:0}); }

  function spawnEnemy(){
    const th=sim.th; const e=sim.eStat;
    const type=Math.random()<0.6?0:(Math.random()<0.6?1:2);
    const hpm=[1,0.7,2.4][type], dmgm=[1,0.9,1.6][type], spm=[1,1.1,0.7][type];
    sim.enemies.push({ x:0.94, hp:e.hp*hpm, maxhp:e.hp*hpm, dmg:e.dmg*dmgm, range:type===1?0.16:0.02, speed:e.speed*spm, atk:e.atk, cd:0, type, col:'#e0603e', phase:Math.random()*6 });
  }
  function spawnBoss(){
    const e=sim.eStat;
    sim.enemies.push({ x:0.9, hp:e.hp*22, maxhp:e.hp*22, dmg:e.dmg*3, range:0.05, speed:0.018, atk:1.4, type:3, boss:true, col:'#ff8bd0', phase:0 });
    sim.bossSpawned=true;
    if (typeof toast==='function') toast(`👑 ${sim.th.boss} approche !`,'bad');
  }

  function loop(){
    if(!running) return;
    const now=performance.now(); const dt=Math.min(0.05,(now-last)/1000); last=now;
    if(sim && !sim.over) step(dt);
    render();
    raf=requestAnimationFrame(loop);
  }

  function step(dt){
    sim.t+=dt;
    sim.biomass=Math.min(400+sim.stage*120, sim.biomass + sim.biomassRate*dt);
    // vagues
    sim.waveT-=dt;
    if (!sim.boss || !sim.bossSpawned){
      if (sim.waveT<=0){
        const dense=sim.boss?0.5:Math.max(0.55, 1.4 - sim.level*0.06);
        spawnEnemy(); sim.waveT=dense*(0.7+Math.random()*0.6); sim.waveN++;
      }
      if (sim.boss && sim.t>18 && !sim.bossSpawned) spawnBoss();
    }
    // tourelle de base
    sim.turretCd-=dt;
    if (sim.turretCd<=0 && sim.enemies.length){
      const tgt=sim.enemies.reduce((a,b)=>b.x<a.x?b:a, sim.enemies[0]);
      sim.projectiles.push({ x:0.05, y:LANE_Y-0.12, tx:tgt.x, ty:LANE_Y, dmg:12*stageMul(sim.stage), from:'base', t:0 });
      sim.turretCd=0.9;
    }
    // unités joueur
    for (const u of sim.units){
      const target=nearestEnemy(u.x);
      if (target && target.x - u.x <= u.range+0.02){
        u.cd-=dt;
        if (u.cd<=0){ u.cd=u.atk;
          if (u.range>0.05){ sim.projectiles.push({x:u.x,y:LANE_Y,tx:target.x,ty:LANE_Y,dmg:u.dmg,from:'u',t:0}); }
          else { target.hp-=u.dmg; addFx((u.x+target.x)/2,LANE_Y,'hit'); }
        }
      } else {
        // avance sauf si un allié bloque juste devant à portée d'ennemi ? simple : avance
        u.x+=u.speed*dt;
        if (u.x>0.9 && !sim.enemies.length){ /* frappe la base ennemie */ }
      }
      // frappe la base ennemie si au bout
      if (u.x>=0.9){ u.cd-=dt; if(u.cd<=0){ u.cd=u.atk; sim.enemyHp-=u.dmg; addFx(0.9,LANE_Y,'hit'); } u.x=0.9; }
    }
    // ennemis
    for (const e of sim.enemies){
      const target=nearestUnit(e.x);
      if (target && e.x - target.x <= e.range+0.02){
        e.cd-=dt; if(e.cd<=0){ e.cd=e.atk;
          if(e.range>0.05){ sim.projectiles.push({x:e.x,y:LANE_Y,tx:target.x,ty:LANE_Y,dmg:e.dmg,from:'e',t:0}); }
          else { target.hp-=e.dmg; addFx((e.x+target.x)/2,LANE_Y,'hit'); }
        }
      } else {
        e.x-=e.speed*dt;
        if (e.x<=0.06){ e.x=0.06; e.cd-=dt; if(e.cd<=0){ e.cd=e.atk; sim.baseHp-=e.dmg; addFx(0.06,LANE_Y,'hit'); } }
      }
    }
    // projectiles
    for (const p of sim.projectiles){ p.t+=dt*3;
      if (p.t>=1){ // impact
        if (p.from==='base'||p.from==='u'){ const tg=nearestEnemyNear(p.tx); if(tg){ tg.hp-=p.dmg; addFx(tg.x,LANE_Y,'hit'); } }
        else { const tg=nearestUnitNear(p.tx); if(tg){ tg.hp-=p.dmg; addFx(tg.x,LANE_Y,'hit'); } }
      }
    }
    sim.projectiles=sim.projectiles.filter(p=>p.t<1);
    // morts → XP & biomasse
    sim.enemies=sim.enemies.filter(e=>{ if(e.hp>0) return true; sim.xp+=e.boss?400:(8+sim.level*2); sim.biomass+=e.boss?60:6; addFx(e.x,LANE_Y,'die'); return false; });
    sim.units=sim.units.filter(u=>{ if(u.hp>0) return true; addFx(u.x,LANE_Y,'die'); return false; });
    // fx
    for (const f of sim.fx) f.t+=dt;
    sim.fx=sim.fx.filter(f=>f.t<1);
    // fin
    if (sim.enemyHp<=0){ endBattle(true); }
    else if (sim.baseHp<=0){ endBattle(false); }
    // MAJ HUD
    document.getElementById('war-biomass').textContent=`${sim.th.biomass} ${Math.floor(sim.biomass)}`;
    document.getElementById('war-xp').textContent=`🧬 XP ${Math.floor(sim.xp)} · Stade ${sim.stage+1}/5`;
    const evo=document.getElementById('wb-evo'); if(evo) evo.textContent=sim.stage>=4?'MAX':fmt(evoCost());
    const spc=document.getElementById('wb-spec'); if(spc) spc.textContent=sim.specialReady>Date.now()?Math.ceil((sim.specialReady-Date.now())/1000)+'s':'PRÊT';
    ARCH.forEach((a,i)=>{ const c=document.getElementById('wb-cost-'+i); if(c) c.textContent=Math.ceil(a.cost*Math.pow(1.15,countUnits(i))); });
  }
  function nearestEnemy(x){ let best=null,bd=9; for(const e of sim.enemies){ const d=e.x-x; if(d>=-0.02 && d<bd){bd=d;best=e;} } return best; }
  function nearestUnit(x){ let best=null,bd=9; for(const u of sim.units){ const d=x-u.x; if(d>=-0.02 && d<bd){bd=d;best=u;} } return best; }
  function nearestEnemyNear(x){ let best=null,bd=9; for(const e of sim.enemies){ const d=Math.abs(e.x-x); if(d<bd){bd=d;best=e;} } return best; }
  function nearestUnitNear(x){ let best=null,bd=9; for(const u of sim.units){ const d=Math.abs(u.x-x); if(d<bd){bd=d;best=u;} } return best; }

  function endBattle(won){
    if (sim.over) return; sim.over=true; sim.won=won; running=false;
    const age=sim.age, lvl=sim.level;
    let reward=0, firstClear=false;
    if (won){
      firstClear=!isCleared(age,lvl);
      if (firstClear){ markCleared(age,lvl);
        reward = lvl===NLEVELS ? Math.round(60*Math.pow(1.5,age-1)) : Math.round((8+lvl*3)*Math.pow(1.35,age-1));
        grantAP(reward); state.war.xpTotal=(state.war.xpTotal||0)+sim.xp;
      }
      if (typeof addDna==='function') addDna(sim.biomass*Math.pow(2.2,age-1)*4);
    }
    const box=document.getElementById('war-end-box');
    const th=sim.th;
    box.innerHTML = won
      ? `<h2 style="color:var(--accent)">${lvl===NLEVELS?'👑 '+th.boss+' vaincu !':'Victoire !'}</h2>
         <p style="color:var(--muted);margin-bottom:12px">${firstClear?`Première victoire — <b>+${reward} ⭐ Points d'Âge</b> !`:'Niveau déjà validé (pas de ⭐ en double). Butin de biomasse récolté.'}</p>
         <button class="war-launch" id="war-again">Continuer</button>`
      : `<h2 style="color:var(--danger)">Défaite…</h2>
         <p style="color:var(--muted);margin-bottom:12px">Ta ${th.base} est tombée. Améliore ta production, reviens plus fort — ou évolue plus vite en jeu.</p>
         <button class="war-launch" id="war-again">Réessayer</button>`;
    document.getElementById('war-end').hidden=false;
    document.getElementById('war-again').addEventListener('click',()=>{ document.getElementById('war-end').hidden=true; renderLevelSelect(); });
    if (won && typeof toast==='function' && firstClear) toast(`⚔️ Victoire niv. ${lvl} · +${reward} ⭐`,'good');
    render();
    if (typeof saveGame==='function') saveGame();
  }

  /* ---------- RENDU procédural ---------- */
  function drawIdle(){
    if(!ctx) return; render(true);
  }
  function render(idle){
    if(!ctx) return;
    const hue=ageHue();
    // fond dark spatial
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,`hsl(${(hue+200)%360},40%,6%)`); g.addColorStop(0.6,'#04101a'); g.addColorStop(1,'#020814');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // étoiles / particules d'ambiance
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<50;i++){ const x=(i*137.5%W), y=((i*89.3)%(H*0.55)); const a=0.15+0.15*Math.sin((sim?sim.t:0)*2+i); ctx.fillStyle=`hsla(${hue},80%,70%,${a})`; ctx.fillRect(x,y,2*dpr,2*dpr); }
    ctx.globalCompositeOperation='source-over';
    // sol
    const ly=H*LANE_Y;
    const gg=ctx.createLinearGradient(0,ly,0,H); gg.addColorStop(0,`hsla(${hue},50%,20%,.5)`); gg.addColorStop(1,'rgba(2,8,20,0)');
    ctx.fillStyle=gg; ctx.fillRect(0,ly,W,H-ly);
    ctx.strokeStyle=`hsla(${hue},70%,55%,.35)`; ctx.lineWidth=2*dpr; ctx.beginPath(); ctx.moveTo(0,ly); ctx.lineTo(W,ly); ctx.stroke();

    // bases
    drawBase(0.03, hue, sim?sim.baseHp/sim.baseMax:1, false);
    drawBase(0.97, 0, sim?Math.max(0,sim.enemyHp/sim.enemyMax):1, true);

    if (!sim || idle){ ctx.fillStyle=`hsla(${hue},60%,70%,.5)`; ctx.font=`${13*dpr}px 'Exo 2',sans-serif`; ctx.textAlign='center'; ctx.fillText('Choisis un niveau et lance la bataille', W/2, H*0.5); ctx.textAlign='start'; return; }

    // tourelle base (canon)
    ctx.save(); ctx.translate(0.05*W, ly-0.12*H); ctx.fillStyle=`hsl(${hue},70%,60%)`; ctx.fillRect(-6*dpr,-6*dpr,20*dpr,12*dpr); ctx.restore();

    // projectiles
    for (const p of sim.projectiles){ const x=(p.x+(p.tx-p.x)*p.t)*W, y=(p.y+(p.ty-p.y)*p.t)*H;
      ctx.fillStyle=p.from==='e'?'#ff9a7a':`hsl(${hue},90%,75%)`; ctx.beginPath(); ctx.arc(x,y,3.5*dpr,0,7); ctx.fill();
      ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=.5; ctx.beginPath(); ctx.arc(x,y,7*dpr,0,7); ctx.fill(); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    }
    // unités
    for (const u of sim.units) drawFighter(u.x*W, ly, u, false);
    for (const e of sim.enemies) drawFighter(e.x*W, ly, e, true);
    // fx
    for (const f of sim.fx) drawFx(f);
  }
  function drawBase(fx, hue, ratio, enemy){
    const x=fx*W, ly=H*LANE_Y; const w=44*dpr, h=90*dpr;
    ctx.save();
    ctx.fillStyle=enemy?'rgba(224,96,62,.85)':`hsla(${hue},60%,45%,.9)`;
    ctx.strokeStyle=enemy?'#ff8b6a':`hsl(${hue},80%,65%)`; ctx.lineWidth=2*dpr;
    const bx=enemy?x-w+8*dpr:x-8*dpr;
    roundRectW(bx, ly-h, w, h, 8*dpr); ctx.fill(); ctx.stroke();
    // glow crénelé
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=.25;
    ctx.fillStyle=enemy?'#ff8b6a':`hsl(${hue},90%,70%)`; roundRectW(bx,ly-h,w,h,8*dpr); ctx.fill(); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    // barre de vie
    const bw=w, bh=6*dpr, by=ly-h-12*dpr;
    ctx.fillStyle='rgba(3,12,20,.8)'; ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle=enemy?'#ff6a4a':`hsl(${hue},80%,60%)`; ctx.fillRect(bx,by,bw*Math.max(0,ratio),bh);
    ctx.restore();
  }
  function drawFighter(x, ly, u, enemy){
    const t=(sim?sim.t:0)+u.phase;
    const s=(u.boss?26:(u.i===2||u.type===2?15:11))*dpr*(1+(u.stage||0)*0.06);
    const bob=Math.sin(t*6)*2*dpr;
    ctx.save(); ctx.translate(x, ly-s-2*dpr+bob);
    const col=u.col||(enemy?'#e0603e':'#3EE6C4');
    // halo
    ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=.35;
    const g=ctx.createRadialGradient(0,0,2,0,0,s*2); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,s*2,0,7); ctx.fill(); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    // corps : forme selon rôle
    ctx.fillStyle=col; ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.5*dpr;
    const role=enemy?u.type:u.i;
    if (u.boss){
      ctx.beginPath(); for(let i=0;i<10;i++){ const a=i/10*7 - 1.57, rr=i%2?s*0.55:s; ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#2a0a18'; ctx.beginPath(); ctx.arc(-s*0.25,-s*0.1,s*0.14,0,7); ctx.arc(s*0.25,-s*0.1,s*0.14,0,7); ctx.fill();
    } else if (role===0){ // assaut : losange pointu
      ctx.beginPath(); ctx.moveTo(enemy?-s:s,0); ctx.lineTo(0,-s*0.8); ctx.lineTo(enemy?s*0.5:-s*0.5,0); ctx.lineTo(0,s*0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (role===1){ // tireur : rond + canon
      ctx.beginPath(); ctx.arc(0,0,s*0.7,0,7); ctx.fill(); ctx.stroke();
      ctx.fillRect(enemy?-s:0,-s*0.15,s,s*0.3);
    } else { // colosse : bloc
      roundRectW(-s*0.75,-s*0.85,s*1.5,s*1.5,s*0.25); ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillRect(-s*0.4,-s*0.4,s*0.8,s*0.2);
    }
    // barre de vie
    if (u.maxhp){ const bw=s*1.8, bh=3*dpr, by=-s-8*dpr;
      ctx.fillStyle='rgba(3,12,20,.8)'; ctx.fillRect(-bw/2,by,bw,bh);
      ctx.fillStyle=enemy?'#ff6a4a':'#8dff9c'; ctx.fillRect(-bw/2,by,bw*Math.max(0,u.hp/u.maxhp),bh);
    }
    ctx.restore();
  }
  function drawFx(f){
    const x=f.x*W, y=H*LANE_Y, p=f.t;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    if (f.kind==='hit'){ ctx.globalAlpha=1-p; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,(4+p*10)*dpr,0,7); ctx.fill(); }
    else if (f.kind==='die'){ ctx.globalAlpha=1-p; for(let i=0;i<6;i++){ const a=i/6*7; ctx.fillStyle='#ffd27a'; ctx.beginPath(); ctx.arc(x+Math.cos(a)*p*22*dpr,y+Math.sin(a)*p*22*dpr,2.5*dpr,0,7); ctx.fill(); } }
    else if (f.kind==='blast'){ ctx.globalAlpha=1-p; ctx.strokeStyle='#ff8bd0'; ctx.lineWidth=3*dpr; ctx.beginPath(); ctx.arc(x,y,p*40*dpr,0,7); ctx.stroke(); }
    else if (f.kind==='evolve'){ ctx.globalAlpha=1-p; ctx.strokeStyle='#3EE6C4'; ctx.lineWidth=3*dpr; ctx.beginPath(); ctx.arc(x,y-20*dpr,p*50*dpr,0,7); ctx.stroke(); }
    else if (f.kind==='special'){ ctx.globalAlpha=(1-p)*0.5; ctx.fillStyle='#ff8bd0'; ctx.fillRect(0,0,W,H); }
    ctx.restore();
  }
  function roundRectW(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  return { open, close, ensure, isCleared, clearedCount, maxUnlocked, NLEVELS };
})();
window.War = War;

/* ============================================================================
   RE-SKIN du bouton diorama & de la Mare selon l'âge (contexte de pêche)
   ============================================================================ */
function applyFishTheme(){
  const th=FISH_THEMES[A()]||FISH_THEMES[1];
  const btn=document.getElementById('open-pond');
  if (btn) btn.textContent=`🎣 ${th.verb} — ${th.pond}`;
  const qb=document.getElementById('quick-pond-btn'); // garde l'icône
}

/* ============================================================================
   HOOKS moteur : production (empire+musée) + timers + reset d'âge
   ============================================================================ */
// wrap fishingProdMult pour y multiplier empire & musée (computeMultipliers lit ce hook)
(function wrapProd(){
  const prev = window.fishingProdMult || (()=>1);
  window.fishingProdMult = function(){
    let m = prev();
    if (window.empireProdMult) m *= window.empireProdMult();
    if (window.museumProdMult) m *= window.museumProdMult();
    return m;
  };
})();

// Boucle de traitement des timers (files + expéditions) — indépendante du tick ADN
function expansionTick(){
  if (!hasState()) return;
  Empire.tick();
  empireAlert();
  // refresh Empire si le panneau est ouvert
  const empOpen = document.getElementById('panel-empire-wrap');
  if (empOpen && empOpen.classList.contains('active') && document.getElementById('side').classList.contains('open')) renderEmpire();
}

// Reset des systèmes au changement d'âge (appelé par le patch de ascend)
window.expansionOnAscend = function(){
  // Empire : on relance la civilisation (nouvelle échelle), on garde le musée
  state.empire = { b:{}, queue:null, exped:[], rushed:0 };
  // War : la progression de niveaux est PAR ÂGE (state.war.cleared[age]) → rien à effacer,
  // le nouvel âge démarre à 0 niveau validé automatiquement.
  refreshHue();
  applyFishTheme();
  _agePools; // no-op
};

/* ============================================================================
   INIT (après boot)
   ============================================================================ */
function init(){
  if (!hasState()) { setTimeout(init, 120); return; }
  injectStyle(); injectDom(); bindEmpire(); refreshHue(); applyFishTheme();
  Empire.ensure(); Museum.ensure(); War.ensure();
  // rattrapage hors-ligne des files & expéditions
  Empire.offlineCatchUp();
  // close war
  const wc=document.getElementById('war-close'); if(wc) wc.addEventListener('click',()=>War.close());
  // boucles
  setInterval(expansionTick, 1000);
  // recolore & re-thème à chaque changement d'âge détecté
  let lastAge=A();
  setInterval(()=>{ if(A()!==lastAge){ lastAge=A(); refreshHue(); applyFishTheme(); } }, 1500);
  refreshHue();
}
document.addEventListener('DOMContentLoaded', init);
if (document.readyState!=='loading') init();

})();
