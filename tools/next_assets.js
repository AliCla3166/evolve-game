#!/usr/bin/env node
/**
 * tools/next_assets.js — EVOLVE
 *
 * Calcule la liste des assets du jeu qui n'ont PAS encore de visuel définitif
 * et retourne les N prochains à générer (JSON tableau {slot, prompt, w, h, removeBg}).
 *
 * Source de vérité : index.html lui-même (RARITIES, CREATURES, PALIERS,
 * ASSET_MANIFEST, ASSET_REFS, DEFAULT_ASSET_FILES, et l'IIFE
 * registerFishingAssets() qui étend dynamiquement le manifeste avec les
 * paliers (20) et les créatures (60)). On extrait ces déclarations et on les
 * exécute dans un bac à sable Node (vm) pour obtenir exactement le même
 * manifeste que celui que le jeu construit au runtime dans le navigateur.
 *
 * "Déjà fait" = le slot a une URL non vide dans DEFAULT_ASSET_FILES (assets
 * livrés/bakés dans index.html) OU dans cdn.json (catalogue dynamique généré
 * au fil de l'eau par ce même outil).
 *
 * Usage: node tools/next_assets.js [N]   (N par défaut = 2)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT, 'index.html');
const CDN_JSON = path.join(ROOT, 'cdn.json');

function fail(msg) {
  process.stderr.write('next_assets.js: ' + msg + '\n');
  process.exit(1);
}

if (!fs.existsSync(INDEX_HTML)) fail('index.html introuvable a la racine du repo (' + INDEX_HTML + ')');

const src = fs.readFileSync(INDEX_HTML, 'utf8');

/**
 * Extrait un literal JS balance ([...] ou {...}) qui commence a startIdx
 * (index du caractere ouvrant lui-meme). Gere les chaines '...', "...", `...`
 * (avec echappement \), les commentaires // et /* *\/, et l'imbrication de
 * [ ] { } ( ).
 */
function extractBalanced(text, startIdx) {
  const openChar = text[startIdx];
  const pairs = { '[': ']', '{': '}', '(': ')' };
  if (!pairs[openChar]) throw new Error('extractBalanced: caractere ouvrant inattendu a ' + startIdx);
  const stack = [openChar];
  let i = startIdx + 1;
  while (stack.length) {
    if (i >= text.length) throw new Error('extractBalanced: fin de fichier atteinte sans fermeture');
    const c = text[i];
    if (c === '/' && text[i + 1] === '/') {
      i = text.indexOf('\n', i);
      if (i === -1) break;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      i = text.indexOf('*/', i + 2);
      if (i === -1) throw new Error('extractBalanced: commentaire bloc non ferme');
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i++;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    if (c === '[' || c === '{' || c === '(') { stack.push(c); i++; continue; }
    if (c === ']' || c === '}' || c === ')') {
      const expected = pairs[stack[stack.length - 1]];
      if (c !== expected) throw new Error('extractBalanced: desequilibre a ' + i + ' (attendu ' + expected + ', trouve ' + c + ')');
      stack.pop();
      i++;
      continue;
    }
    i++;
  }
  return text.slice(startIdx, i);
}

function extractConst(name) {
  const re = new RegExp('const\\s+' + name + '\\s*=\\s*');
  const m = re.exec(src);
  if (!m) fail('declaration "const ' + name + '" introuvable dans index.html — le jeu a peut-etre change de structure, il faut adapter ce script.');
  const startIdx = m.index + m[0].length;
  return extractBalanced(src, startIdx);
}

function extractIife(name) {
  const re = new RegExp('\\(function\\s+' + name + '\\s*\\(\\s*\\)\\s*\\{');
  const m = re.exec(src);
  if (!m) fail('IIFE "' + name + '" introuvable dans index.html.');
  const braceIdx = m.index + m[0].length - 1;
  const block = extractBalanced(src, braceIdx);
  return block;
}

function extractStringConst(name) {
  const re = new RegExp('const\\s+' + name + '\\s*=\\s*([\'"])((?:\\\\.|(?!\\1).)*)\\1');
  const m = re.exec(src);
  if (!m) fail('declaration "const ' + name + '" (string) introuvable dans index.html.');
  return JSON.stringify(m[2]);
}

const CDN_SRC = extractStringConst('CDN');
const RARITIES_SRC = extractConst('RARITIES');
const CREATURES_SRC = extractConst('CREATURES');
const PALIERS_SRC = extractConst('PALIERS');
const ASSET_MANIFEST_SRC = extractConst('ASSET_MANIFEST');
const ASSET_REFS_SRC = extractConst('ASSET_REFS');
const DEFAULT_ASSET_FILES_SRC = extractConst('DEFAULT_ASSET_FILES');
const REGISTER_FISHING_ASSETS_BODY = extractIife('registerFishingAssets');

const sandbox = {};
vm.createContext(sandbox);

const script = `
const CDN = ${CDN_SRC};
const RARITIES = ${RARITIES_SRC};
const CREATURES = ${CREATURES_SRC};
const PALIERS = ${PALIERS_SRC};
const ASSET_MANIFEST = ${ASSET_MANIFEST_SRC};
const ASSET_REFS = ${ASSET_REFS_SRC};
const DEFAULT_ASSET_FILES = ${DEFAULT_ASSET_FILES_SRC};
(function registerFishingAssets()${REGISTER_FISHING_ASSETS_BODY})();
globalThis.__RESULT__ = { RARITIES, CREATURES, PALIERS, ASSET_MANIFEST, ASSET_REFS, DEFAULT_ASSET_FILES };
`;

try {
  vm.runInContext(script, sandbox, { filename: 'evolve-asset-manifest.js' });
} catch (e) {
  fail('echec de l\'evaluation du manifeste extrait de index.html: ' + e.message);
}

const { ASSET_MANIFEST, ASSET_REFS, DEFAULT_ASSET_FILES } = sandbox.__RESULT__;

const allEntries = [
  ...ASSET_REFS.map(r => ({ ...r, w: 1024, h: 1024 })),
  ...ASSET_MANIFEST,
];

let cdn = {};
if (fs.existsSync(CDN_JSON)) {
  try { cdn = JSON.parse(fs.readFileSync(CDN_JSON, 'utf8')) || {}; } catch (e) { cdn = {}; }
}

function hasVisual(slot) {
  const baked = DEFAULT_ASSET_FILES[slot];
  const bakedUrl = Array.isArray(baked) ? baked[baked.length - 1] : baked;
  if (bakedUrl) return true;
  if (cdn[slot]) return true;
  return false;
}

function needsRemoveBg(prompt) {
  return /black background/i.test(prompt || '');
}

const missing = allEntries
  .filter(e => e.slot && e.prompt && !hasVisual(e.slot))
  .map(e => ({
    slot: e.slot,
    prompt: e.prompt,
    w: e.w || 512,
    h: e.h || 512,
    removeBg: needsRemoveBg(e.prompt),
  }));

const n = Math.max(0, parseInt(process.argv[2], 10) || 2);
process.stdout.write(JSON.stringify(missing.slice(0, n)) + '\n');
