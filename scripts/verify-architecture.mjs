/**
 * Architecture verification — Milestone 8
 * Structural checks (imports/exports/APIs), not comment sniffing.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Exact frozen PUBLIC v1.0 headings (production allowed only in the mapper). */
const PUBLIC_HEADINGS = Object.freeze([
  'Anbietertyp',
  'Name des Anbieters',
  'Website des Anbieters',
  'Logo des Anbieters',
  'PHC-CPD-ID',
  'Vollständiger Titel',
  'Kurztitel',
  'Kurzbeschreibung',
  'Ausführliche Beschreibung',
  'Veranstaltungsort',
  'Anrechenbare Weiterbildungsstunden (CPD)',
  'Bild der Weiterbildung',
  'QR-Code (optional)',
  'Primärkategorie',
  'Weitere Kategorien',
  'Durchführungsformat',
  'Terminart',
  'Nächster Start',
  'Durchführung / Zeitplan',
  'Kursseite / Anmeldung',
]);

const MAPPER_REL = 'src/specializations/cpd/map-public-row.js';

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function listJsFiles(dirRel) {
  const abs = join(root, dirRel);
  if (!existsSync(abs)) {
    return [];
  }

  /** @type {string[]} */
  const files = [];

  function walk(currentAbs) {
    for (const name of readdirSync(currentAbs)) {
      const full = join(currentAbs, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (name.endsWith('.js')) {
        files.push(relative(root, full));
      }
    }
  }

  walk(abs);
  return files;
}

assert(!existsSync(join(root, 'src/query')), 'src/query/ must not exist');

const resultSrc = read('src/search/result.js');
assert(
  /export function createSearchResult/.test(resultSrc),
  'SearchResult factory missing',
);
assert(!/getById\s*\(/.test(resultSrc), 'SearchResult must not expose getById');
assert(!/new Map\s*\(/.test(resultSrc), 'SearchResult must not keep an ID Map');

const { createSearchResult } = await import(
  pathToFileURL(join(root, 'src/search/result.js')).href
);
const sampleResult = createSearchResult([{ course: { id: 'A', title: 'T' } }]);
assert(
  Reflect.ownKeys(sampleResult).map(String).sort().join(',') === 'getAll,size',
  'SearchResult keys must be size + getAll only',
);

const renderFiles = ['src/render/render.js', 'src/render/states.js'];
for (const file of renderFiles) {
  const src = read(file);
  assert(!/from '\.\.\/catalog\//.test(src), `${file} must not import catalog`);
  assert(!/from '\.\.\/search\//.test(src), `${file} must not import search`);
  assert(!/specializations\/cpd/.test(src), `${file} must not import CPD`);
  assert(!/data\/source/.test(src), `${file} must not import data source`);
  assert(!/map-public-row/.test(src), `${file} must not import PUBLIC mapper`);
}

const catalogSrc = read('src/catalog/catalog.js');
assert(
  !/specializations\/cpd/.test(catalogSrc),
  'Catalog must not import CPD specialization',
);

const searchSrc = read('src/search/search.js');
assert(
  !/specializations\/cpd/.test(searchSrc),
  'Search must not import CPD specialization',
);

const mapperSrc = read(MAPPER_REL);
assert(
  !/Provider-ID|PROV-|Anbieter-ID|PHC-Anbieter-ID/.test(mapperSrc),
  'PUBLIC mapper must not include Provider ID',
);
for (const heading of PUBLIC_HEADINGS) {
  assert(
    mapperSrc.includes(heading),
    `PUBLIC mapper must include heading: ${heading}`,
  );
}

const courseSrc = read('src/specializations/cpd/course.js');
assert(
  !/Provider-ID|PROV-|Anbieter-ID|PHC-Anbieter-ID/.test(courseSrc),
  'CPD entity must not include Provider ID',
);
assert(
  !courseSrc.includes('PHC-CPD-ID'),
  'CPD constructor must not mention PHC-CPD-ID',
);

const productionJs = listJsFiles('src');
for (const file of productionJs) {
  if (file === MAPPER_REL) {
    continue;
  }

  const src = read(file);
  for (const heading of PUBLIC_HEADINGS) {
    assert(
      !src.includes(heading),
      `Frozen PUBLIC heading "${heading}" must not appear in production file ${file}`,
    );
  }
}

const statesSrc = read('src/render/states.js');
assert(
  !/phc-directory__card/.test(statesSrc),
  'No course card UI class expected in Milestone 8',
);
assert(
  !/data-phc-filter/.test(statesSrc),
  'No filtering UI expected in Milestone 8',
);

console.log('Architecture verification passed.');
