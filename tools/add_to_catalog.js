#!/usr/bin/env node
/**
 * tools/add_to_catalog.js — EVOLVE
 *
 * Ajoute des paires slot/URL au catalogue dynamique cdn.json (racine du repo),
 * charge par le jeu via `fetch('cdn.json')` (voir index.html, preloadAssets()).
 * Si un dossier dist/ existe (build statique), met aussi a jour dist/cdn.json
 * en miroir pour compatibilite avec un eventuel pipeline de build. Ne touche
 * a aucun autre fichier.
 *
 * Usage: node tools/add_to_catalog.js <slot1> <url1> [<slot2> <url2> ...]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CDN_JSON = path.join(ROOT, 'cdn.json');
const DIST_CDN_JSON = path.join(ROOT, 'dist', 'cdn.json');

function fail(msg) {
  process.stderr.write('add_to_catalog.js: ' + msg + '\n');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.length % 2 !== 0) {
  fail('usage: node tools/add_to_catalog.js <slot1> <url1> [<slot2> <url2> ...] (nombre pair d\'arguments requis, recu ' + args.length + ')');
}

const pairs = [];
for (let i = 0; i < args.length; i += 2) {
  const slot = args[i];
  const url = args[i + 1];
  if (!slot || !url) fail('slot ou url vide (paire #' + (i / 2 + 1) + ')');
  pairs.push([slot, url]);
}

function readJson(file) {
  if (!fs.existsSync(file)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (e) {
    return {};
  }
}

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}

const cdn = readJson(CDN_JSON);
for (const [slot, url] of pairs) cdn[slot] = url;
writeJson(CDN_JSON, cdn);

// Miroir dist/cdn.json uniquement si un dossier dist/ existe deja (pas de
// build step dans ce repo statique a l'heure actuelle, mais on reste
// compatible si un pipeline de build est ajoute plus tard).
if (fs.existsSync(path.join(ROOT, 'dist'))) {
  const distCdn = readJson(DIST_CDN_JSON);
  for (const [slot, url] of pairs) distCdn[slot] = url;
  writeJson(DIST_CDN_JSON, distCdn);
}

process.stdout.write('OK: ' + pairs.map(p => p[0]).join(', ') + ' ajoutes a cdn.json\n');
