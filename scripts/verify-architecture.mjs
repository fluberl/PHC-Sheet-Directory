/**
 * Architecture verification — Milestone 12
 * Structural checks (imports/exports/APIs), not comment sniffing.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Exact PUBLIC headings (production allowed only in the mapper). */
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
  'Unterrichtssprache',
  'Durchführungsformat',
  'Terminart',
  'Nächster Start',
  'Durchführung / Zeitplan',
  'Kursseite / Anmeldung',
  'Veröffentlicht',
]);

const TAXONOMY_IDS = Object.freeze([
  'lifestyle-medicine',
  'mental-health-wellbeing',
  'womens-health',
  'mens-health',
  'healthy-ageing',
  'prevention-health-promotion',
  'health-coaching-communication',
  'integrative-health',
  'professional-development',
]);

const MAPPER_REL = 'src/specializations/cpd/map-public-row.js';
const TAXONOMY_REL = 'src/specializations/cpd/taxonomy.js';

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
assert(existsSync(join(root, TAXONOMY_REL)), 'CPD taxonomy module required');

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

const genericFiles = [
  'src/render/render.js',
  'src/render/states.js',
  'src/catalog/catalog.js',
  'src/search/search.js',
  'src/search/result.js',
  'src/domain/accessors.js',
  'src/domain/entry.js',
  'src/domain/transform.js',
  'src/state/state.js',
  'src/interaction/interaction.js',
];

for (const file of genericFiles) {
  const src = read(file);
  assert(
    !/specializations\/cpd/.test(src),
    `${file} must not import CPD specialization`,
  );
  assert(
    !/map-public-row|taxonomy\.js/.test(src),
    `${file} must not import CPD mapper/taxonomy`,
  );
  assert(
  !/Course information and registration|CPD hours|Also listed under|CPD offerings|Kursinformationen und Anmeldung|CPD-Stunden|Auch gelistet unter/.test(
    src,
  ),
  `${file} must not contain CPD presentation labels`,
);
  for (const id of TAXONOMY_IDS) {
    assert(
      !src.includes(id),
      `${file} must not hard-code PHC taxonomy id ${id}`,
    );
  }
  assert(
    !/Lifestyle Medicine|Mental Health & Wellbeing|Women's Health|Mentale Gesundheit|Frauengesundheit/.test(src),
    `${file} must not hard-code PHC taxonomy labels`,
  );
}

const searchSrc = read('src/search/search.js');
assert(
  /getSearchableText|getPrimaryCategoryId|getCategoryIds/.test(searchSrc),
  'Generic search must use accessor hooks for discovery fields',
);
assert(
  !/querySelectorAll\(|getElementsByClassName\(/.test(searchSrc),
  'Search must not use ad hoc DOM filtering',
);

const interactionSrc = read('src/interaction/interaction.js');
assert(
  !/querySelectorAll\(|getElementsByClassName\(/.test(interactionSrc),
  'Interaction must not filter cards via DOM queries',
);

const renderFiles = ['src/render/render.js', 'src/render/states.js'];
for (const file of renderFiles) {
  const src = read(file);
  assert(!/from '\.\.\/catalog\//.test(src), `${file} must not import catalog`);
  assert(!/from '\.\.\/search\//.test(src), `${file} must not import search`);
  assert(!/data\/source/.test(src), `${file} must not import data source`);
  assert(
    !/phc-directory__card/.test(src),
    `${file} must not own CPD card markup classes`,
  );
}

const taxonomySrc = read(TAXONOMY_REL);
for (const id of TAXONOMY_IDS) {
  assert(taxonomySrc.includes(id), `Taxonomy must define ${id}`);
}

const presentationSrc = read('src/specializations/cpd/presentation.js');
assert(
  !/map-public-row|PUBLIC_COLUMNS|Anbietertyp|Vollständiger Titel/.test(
    presentationSrc,
  ),
  'Presentation projection must not read PUBLIC headings or mapper',
);
assert(
  !/innerHTML|insertAdjacentHTML/.test(presentationSrc),
  'Presentation projection must not build HTML strings',
);

const cardsSrc = read('src/specializations/cpd/render-cards.js');
assert(
  !/map-public-row|PUBLIC_COLUMNS|Anbietertyp|Vollständiger Titel/.test(cardsSrc),
  'Card renderer must not read PUBLIC headings or mapper',
);
assert(
  !/innerHTML|insertAdjacentHTML/.test(cardsSrc),
  'Card renderer must not use unsafe HTML insertion',
);
assert(
  !/provider-type|Provider type|Anbietertyp/.test(cardsSrc),
  'Card renderer must not present provider type',
);
assert(
  cardsSrc.includes('CPD-Stunden') || cardsSrc.includes('cpdHours'),
  'Card renderer must use CPD-Stunden wording',
);
assert(
  !cardsSrc.includes('Recognition'),
  'Card renderer must not use Recognition wording',
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
  /data-phc-category/.test(statesSrc),
  'Discovery category control expected in lifecycle shell',
);
assert(
  /data-phc-view/.test(statesSrc),
  'View mode control expected in lifecycle shell',
);
assert(
  !/Calendar Cards|Chronological List|catalogue|Kalenderkarten|Chronologische Liste/.test(statesSrc),
  'Generic lifecycle shell must not hard-code CPD view labels',
);
assert(
  !/filter-sidebar|accordion/.test(statesSrc),
  'No complex filter chrome in generic lifecycle shell',
);

const viewsSrc = read('src/specializations/cpd/render-views.js');
assert(
  /createCpdCourseCardList/.test(viewsSrc),
  'View selector must reuse editorial card list',
);
assert(
  /createCpdChronologicalList/.test(viewsSrc),
  'View selector must include chronological list',
);
assert(
  !/map-public-row|PUBLIC_COLUMNS|fetchPublic/.test(viewsSrc),
  'View selector must stay independent of datasource',
);

const listSrc = read('src/specializations/cpd/render-list.js');
assert(
  !/map-public-row|PUBLIC_COLUMNS|Anbietertyp|Vollständiger Titel/.test(listSrc),
  'Chronological list must not read PUBLIC headings or mapper',
);
assert(
  !/innerHTML|insertAdjacentHTML/.test(listSrc),
  'Chronological list must not use unsafe HTML insertion',
);

const cssSrc = read('assets/styles/phc-directory.css');
assert(
  cssSrc.includes('#phc-cpd-directory'),
  'Styles must remain scoped to the mount root',
);
assert(
  !/(^|\n)\s*(body|h1|p|ul|a)\s*\{/.test(cssSrc),
  'Styles must not use unscoped broad element selectors',
);
assert(
  !/#phc-cpd-directory[\s\S]*\border\s*:/.test(cssSrc),
  'Card media alternation must not use CSS order',
);
assert(
  cssSrc.includes('phc-directory__view-select'),
  'Styles must cover the view selector',
);
assert(
  cssSrc.includes('phc-directory__schedule'),
  'Styles must cover the chronological schedule',
);

const publicCpdSrc = read('src/config/phc-public-cpd.js');
assert(
  publicCpdSrc.includes('output=csv'),
  'Production PUBLIC CPD source must be the published Sheets CSV',
);

const sourceSrc = read('src/data/source.js');
assert(
  /parseCsvObjects/.test(sourceSrc),
  'Data source must support CSV PUBLIC payloads',
);
assert(
  /readCachedPublicPayload/.test(sourceSrc),
  'Data source must support last-good cache fallback',
);

for (const file of [
  'src/render/render.js',
  'src/render/states.js',
  'src/specializations/cpd/render-cards.js',
  'src/specializations/cpd/render-list.js',
  'src/specializations/cpd/render-views.js',
]) {
  const src = read(file);
assert(
  !/docs\.google\.com|parseCsvObjects|fetchPublic/.test(src),
    `${file} must remain datasource-independent`,
  );
}

assert(
  existsSync(join(root, 'wordpress/phc-cpd-directory/phc-cpd-directory.php')),
  'WordPress plugin main file required',
);
const wpPhp = read('wordpress/phc-cpd-directory/phc-cpd-directory.php');
assert(
  wpPhp.includes('<div id="phc-cpd-directory"></div>'),
  'WordPress shortcode must emit fixed mount root',
);
assert(
  !wpPhp.includes('docs.google.com'),
  'WordPress PHP must not duplicate the Sheets URL',
);

console.log('Architecture verification passed.');
