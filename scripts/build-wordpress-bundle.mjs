/**
 * Build the WordPress production JavaScript bundle.
 * Collapses the modular ESM graph into one IIFE so WordPress enqueues a
 * single file and nested plugin modules are never fetched at runtime.
 */

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertProductionBundle } from './assert-production-bundle.mjs';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = join(root, 'wordpress', 'phc-cpd-directory');
const entry = join(root, 'scripts', 'wordpress-bundle-entry.js');
const outfile = join(
  pluginRoot,
  'assets',
  'js',
  'phc-cpd-directory.bundle.js',
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(existsSync(entry), 'WordPress bundle entry missing');
assert(existsSync(join(root, 'src', 'bootstrap.js')), 'Application src missing');

mkdirSync(dirname(outfile), { recursive: true });

const result = await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2018'],
  charset: 'utf8',
  outfile,
  logLevel: 'silent',
  write: true,
  metafile: true,
  legalComments: 'none',
});

const bundle = readFileSync(outfile, 'utf8');
assertProductionBundle(bundle, assert);

const inputs = Object.keys(result.metafile?.inputs ?? {});
writeFileSync(
  join(pluginRoot, 'assets', 'BUNDLE.json'),
  `${JSON.stringify(
    {
      builtAt: new Date().toISOString(),
      entry: 'scripts/wordpress-bundle-entry.js',
      outfile: 'assets/js/phc-cpd-directory.bundle.js',
      format: 'iife',
      bundler: 'esbuild',
      charset: 'utf8',
      pluginVersion: '1.0.5',
      inputCount: inputs.length,
    },
    null,
    2,
  )}\n`,
);

console.log('WordPress production bundle built:');
console.log(`  ${outfile}`);
console.log(`  inputs: ${inputs.length}`);
