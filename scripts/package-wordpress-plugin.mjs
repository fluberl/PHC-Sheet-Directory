/**
 * Package the WordPress plugin into dist/phc-cpd-directory-VERSION-m19.zip
 * with exactly one top-level folder: phc-cpd-directory/
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { assertProductionBundle } from './assert-production-bundle.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = join(root, 'wordpress', 'phc-cpd-directory');
const wordpressDir = join(root, 'wordpress');
const distDir = join(root, 'dist');
const version = '1.0.9';
const zipName = `phc-cpd-directory-${version}-m19.zip`;
const zipPath = join(distDir, zipName);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Remove obsolete release ZIPs so each package run leaves exactly one archive.
 * Does not delete source files or the unpacked plugin directory.
 */
function cleanObsoleteZipArtifacts() {
  if (existsSync(wordpressDir)) {
    for (const name of readdirSync(wordpressDir)) {
      if (!name.endsWith('.zip')) {
        continue;
      }
      rmSync(join(wordpressDir, name), { force: true });
      console.log(`Removed obsolete ZIP: wordpress/${name}`);
    }
  }

  mkdirSync(distDir, { recursive: true });
  for (const name of readdirSync(distDir)) {
    if (!name.endsWith('.zip')) {
      continue;
    }
    rmSync(join(distDir, name), { force: true });
    console.log(`Removed obsolete ZIP: dist/${name}`);
  }
}

assert(existsSync(pluginRoot), 'Plugin directory missing');

const php = readFileSync(join(pluginRoot, 'phc-cpd-directory.php'), 'utf8');
assert(php.includes(`Version:           ${version}`), 'PHP header version');
assert(php.includes(`VERSION = '${version}'`), 'PHP VERSION constant');

const bundlePath = join(
  pluginRoot,
  'assets',
  'js',
  'phc-cpd-directory.bundle.js',
);
assert(existsSync(bundlePath), 'production bundle missing — run deploy first');

const bundle = readFileSync(bundlePath, 'utf8');
assertProductionBundle(bundle, assert);
assert(bundle.includes('Nach Datum'), 'bundle must include Nach Datum view label');
assert(
  !bundle.includes('Kalenderkarten'),
  'bundle must not include obsolete Kalenderkarten label',
);
assert(
  !existsSync(join(pluginRoot, 'assets', 'js', 'src')),
  'plugin must not ship nested ESM src/',
);

const pluginCss = readFileSync(
  join(pluginRoot, 'assets', 'css', 'phc-directory.css'),
  'utf8',
);
assert(
  !pluginCss.includes('Kalenderkarten'),
  'plugin CSS must not contain obsolete Kalenderkarten label',
);
assert(
  /max-width:\s*1040px/.test(pluginCss),
  'plugin CSS must set directory max-width 1040px',
);
assert(
  /margin-inline:\s*auto/.test(pluginCss),
  'plugin CSS must center the directory container',
);
assert(
  pluginCss.includes('"Open Sans", Arial, sans-serif') ||
    pluginCss.includes("'Open Sans', Arial, sans-serif"),
  'plugin CSS must use explicit Open Sans UI stack',
);
assert(pluginCss.includes('#235853'), 'plugin CSS must include PHC Green');
assert(pluginCss.includes('#e76827'), 'plugin CSS must include Tango Orange');
assert(pluginCss.includes('#b7dbd1'), 'plugin CSS must include Edgewater');
assert(pluginCss.includes('#808080'), 'plugin CSS must include PHC Grey');
assert(
  /Georgia,\s*'Times New Roman',\s*serif/.test(pluginCss),
  'plugin CSS must preserve editorial serif',
);
assert(
  /@media\s*\(\s*min-width:\s*40\.0625rem\s*\)/.test(pluginCss),
  'plugin CSS must include M16 desktop card breakpoint',
);
assert(
  /justify-self:\s*center/.test(pluginCss),
  'plugin CSS must center desktop course images in their column',
);
assert(
  /width:\s*320px/.test(pluginCss) && /height:\s*320px/.test(pluginCss),
  'plugin CSS must use 320px desktop course images',
);
assert(
  /background:\s*#fff/.test(pluginCss) &&
    /border:\s*1px\s+solid\s+var\(--phc-edgewater\)/.test(pluginCss),
  'plugin CSS must include contained M17 card chrome',
);
assert(
  /phc-directory__card-details/.test(pluginCss) &&
    /phc-directory__card-cta/.test(pluginCss) &&
    /background:\s*var\(--phc-edgewater\)/.test(pluginCss) &&
    !/\.phc-directory__card::before\s*\{/.test(pluginCss),
  'plugin CSS must include M18 refinements (Edgewater CTA, no accent)',
);

cleanObsoleteZipArtifacts();

const zip = spawnSync(
  'zip',
  [
    '-r',
    zipPath,
    'phc-cpd-directory',
    '-x',
    '*.DS_Store',
    '-x',
    '*/.git/*',
  ],
  {
    cwd: wordpressDir,
    encoding: 'utf8',
  },
);
assert(zip.status === 0, `zip failed: ${zip.stderr || zip.stdout}`);

// Verify zip layout: exactly one top-level folder.
const list = spawnSync('zipinfo', ['-1', zipPath], { encoding: 'utf8' });
assert(list.status === 0, 'zipinfo failed');
const entries = list.stdout
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);
const top = new Set(
  entries.map((entry) => entry.split('/')[0]).filter(Boolean),
);
assert(top.size === 1, `expected one top-level entry, got: ${[...top].join(', ')}`);
assert(top.has('phc-cpd-directory'), 'top-level folder must be phc-cpd-directory');
assert(
  entries.some((entry) =>
    entry.endsWith('assets/js/phc-cpd-directory.bundle.js'),
  ),
  'zip must include production bundle',
);
assert(
  !entries.some((entry) => entry.includes('/assets/js/src/')),
  'zip must not include nested ESM src/',
);
assert(
  !entries.some((entry) => entry.endsWith('/assets/js/phc-cpd-directory.js')),
  'zip must not include modular entry source',
);
assert(
  entries.filter((entry) => entry.endsWith('.js')).length === 1,
  'zip must contain exactly one JavaScript file (the production bundle)',
);

const remainingDistZips = readdirSync(distDir).filter((name) =>
  name.endsWith('.zip'),
);
assert(
  remainingDistZips.length === 1 && remainingDistZips[0] === zipName,
  `dist/ must contain only ${zipName}`,
);
assert(
  readdirSync(wordpressDir).every((name) => !name.endsWith('.zip')),
  'wordpress/ must not contain ZIP artifacts',
);

const size = statSync(zipPath).size;
console.log(`Packaged ${zipName} (${size} bytes)`);
console.log(`  ${zipPath}`);
