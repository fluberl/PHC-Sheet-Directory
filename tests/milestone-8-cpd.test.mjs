/**
 * Milestone 8 tests — CPD domain, mapper, catalog, search, snapshot.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCatalog } from '../src/catalog/catalog.js';
import { flatRecordAccessors } from '../src/domain/accessors.js';
import { searchCatalog } from '../src/search/search.js';
import { createState } from '../src/state/state.js';
import { validateTransportRows } from '../src/schema/transport.js';
import {
  createCpdCourse,
  cpdRecordAccessors,
  mapPublicRowToCpdCourse,
  mapPublicRowsToCpdCourses,
  normalizeCpdHours,
  parseStringList,
} from '../src/specializations/cpd/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFrozen(value, label) {
  assert(Object.isFrozen(value), `${label} must be frozen`);
}

console.log('Running Milestone 8 tests…');

// --- CPD constructor ---
{
  const course = createCpdCourse({
    providerType: ' Institution / Organisation ',
    providerName: ' Living Sense ',
    providerWebsiteUrl: ' https://example.org ',
    providerLogoUrl: '',
    courseId: ' PHC-CPD-001 ',
    title: ' Coaching Practitioner CIS ',
    shortTitle: '',
    summary: ' Summary ',
    description: ' Desc ',
    location: ' Zürich ',
    cpdHours: '24',
    imageUrl: '',
    qrCodeUrl: '',
    primaryCategory: ' Coaching ',
    additionalCategories: 'Kommunikation, Stress & Resilienz',
    formats: 'Präsenz, Online (live)',
    scheduleType: 'Wiederkehrend',
    nextStart: '2026-09-01',
    scheduleDescription: 'Plan',
    courseUrl: 'https://example.org/c',
  });

  assert(course.provider.name === 'Living Sense', 'trim provider name');
  assert(course.course.id === 'PHC-CPD-001', 'trim course id');
  assert(course.course.title === 'Coaching Practitioner CIS', 'trim title');
  assert(course.course.shortTitle === '', 'empty short title preserved');
  assert(course.course.cpdHours === 24, 'hours 24');
  assert(
    course.classification.categories.join('|') ===
      'Kommunikation|Stress & Resilienz',
    'categories',
  );
  assert(
    course.delivery.formats.join('|') === 'Präsenz|Online (live)',
    'formats',
  );
  assertFrozen(course, 'root');
  assertFrozen(course.provider, 'provider');
  assertFrozen(course.course, 'course');
  assertFrozen(course.classification, 'classification');
  assertFrozen(course.classification.categories, 'categories');
  assertFrozen(course.delivery, 'delivery');
  assertFrozen(course.delivery.formats, 'formats');

  let failed = false;
  try {
    createCpdCourse({ providerName: 'A', title: 'T' });
  } catch {
    failed = true;
  }
  assert(failed, 'missing id fails');

  failed = false;
  try {
    createCpdCourse({ courseId: 'X', providerName: 'A' });
  } catch {
    failed = true;
  }
  assert(failed, 'missing title fails');

  failed = false;
  try {
    createCpdCourse({ courseId: 'X', title: 'T' });
  } catch {
    failed = true;
  }
  assert(failed, 'missing provider name fails');
}

// --- CPD hours ---
{
  assert(normalizeCpdHours(24) === 24, 'number hours');
  assert(normalizeCpdHours('6.5') === 6.5, 'dot hours');
  assert(normalizeCpdHours('2,25') === 2.25, 'comma hours');
  assert(normalizeCpdHours('') === null, 'empty hours');
  assert(normalizeCpdHours(null) === null, 'null hours');
  let failed = false;
  try {
    normalizeCpdHours('TBD');
  } catch {
    failed = true;
  }
  assert(failed, 'invalid hours fail');
}

// --- lists ---
{
  const fromString = parseStringList(' a , , b ');
  assert(fromString.join('|') === 'a|b', 'list from string');
  assertFrozen(fromString, 'list frozen');
  const fromArray = parseStringList([' x ', '', 'y']);
  assert(fromArray.join('|') === 'x|y', 'list from array preserves order');
}

// --- PUBLIC mapper ---
{
  const fixture = JSON.parse(
    readFileSync(join(root, 'examples/public/sample-public.json'), 'utf8'),
  );
  const courses = mapPublicRowsToCpdCourses(fixture);
  assert(courses.length === fixture.length, 'fixture course count');
  assert(courses[0].course.id === 'PHC-CPD-001', 'id 1');
  assert(courses[0].course.location === 'Zürich', 'location in course');
  assert(courses[0].course.cpdHours === 24, 'hours mapped');
  assert(
    courses[0].delivery.formats.join('|') === 'Präsenz|Online (live)',
    'formats mapped',
  );
  assert(courses[0].delivery.scheduleType === 'Wiederkehrend', 'schedule type');
  assert(courses[1].course.cpdHours === 2.25, 'comma hours mapped');
  assert(!('providerId' in courses[0]), 'no providerId');
  assert(!('providerId' in courses[0].provider), 'no provider.providerId');

  const one = mapPublicRowToCpdCourse(fixture[0]);
  assert(one.course.title === 'Health Coaching Fundamentals', 'title mapped');
}

// --- Catalog ---
{
  const fixture = JSON.parse(
    readFileSync(join(root, 'examples/public/sample-public.json'), 'utf8'),
  );
  const courses = mapPublicRowsToCpdCourses(fixture);
  const catalog = createCatalog(courses, cpdRecordAccessors);
  assert(catalog.size === fixture.length, 'catalog size');
  assert(catalog.getById('PHC-CPD-001') === courses[0], 'getById');
  assert(catalog.getById('missing') === null, 'missing id');
  assert(
    catalog.getAll().map((c) => c.course.id).join('|').startsWith('PHC-CPD-001|PHC-CPD-005'),
    'order starts with first fixtures',
  );
  const all = catalog.getAll();
  let mutated = false;
  try {
    all.push({});
    mutated = all.length === fixture.length + 1;
  } catch {
    /* frozen */
  }
  assert(!mutated && all.length === fixture.length, 'catalog immutable');
}

// --- Search ---
{
  const fixture = JSON.parse(
    readFileSync(join(root, 'examples/public/sample-public.json'), 'utf8'),
  );
  const courses = mapPublicRowsToCpdCourses(fixture);
  const catalog = createCatalog(courses, cpdRecordAccessors);
  const all = searchCatalog(catalog, { text: '' }, cpdRecordAccessors);
  assert(all.size === fixture.length, 'empty search');
  assert(
    Reflect.ownKeys(all).map(String).sort().join(',') === 'getAll,size',
    'search result api',
  );
  const hit = searchCatalog(
    catalog,
    { text: 'EASYBITS' },
    cpdRecordAccessors,
  );
  assert(hit.size === 1, 'case search');
  assert(hit.getAll()[0].course.id === 'PHC-CPD-005', 'hit id');
}

// Flat accessors still work for generic entries
{
  const catalog = createCatalog(
    [
      { id: 'A', title: 'Alpha' },
      { id: 'B', title: 'Beta' },
    ],
    flatRecordAccessors,
  );
  assert(searchCatalog(catalog, { text: 'bet' }).size === 1, 'flat search');
}

// --- State / snapshot ---
{
  const fixture = JSON.parse(
    readFileSync(join(root, 'examples/public/sample-public.json'), 'utf8'),
  );
  const transport = validateTransportRows(fixture);
  assert(transport.valid, 'transport valid');
  const courses = mapPublicRowsToCpdCourses(fixture);
  const catalog = createCatalog(courses, cpdRecordAccessors);
  const searchResult = searchCatalog(catalog, { text: '' }, cpdRecordAccessors);
  const state = createState();
  state.setReady({
    validationResult: transport,
    entries: courses,
    catalog,
    searchResult,
    searchText: '',
    recordAccessors: cpdRecordAccessors,
  });
  const snap = state.getSnapshot();
  assert(snap.lifecycle === 'ready', 'ready');
  assert(
    snap.rowCount === fixture.length && snap.resultCount === fixture.length,
    'counts',
  );
  assert(
    Array.isArray(snap.results) && snap.results.length === fixture.length,
    'results',
  );
  assert(snap.results[0].id === 'PHC-CPD-001', 'projection id');
  assert(
    snap.results[0].title === 'Health Coaching Fundamentals',
    'projection title',
  );
  assert(state.getAcquiredRows() === null, 'no raw rows retained on ready');
  state.setSearchText('easybits');
  assert(state.getSnapshot().resultCount === 1, 'search updates projection');
  assert(
    !JSON.stringify(state.getSnapshot()).includes('Name des Anbieters'),
    'no German headings in snapshot',
  );
}

console.log('All Milestone 8 tests passed.');
