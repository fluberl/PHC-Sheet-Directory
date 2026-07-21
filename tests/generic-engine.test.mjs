/**
 * Generic flat-directory engine regression tests (Milestones 4–7 path).
 * Proves Milestone 8 accessors did not break { id, title } catalogues.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCatalog } from '../src/catalog/catalog.js';
import {
  flatRecordAccessors,
  projectIdTitleResults,
} from '../src/domain/accessors.js';
import { createDirectoryEntry } from '../src/domain/entry.js';
import { transformRowsToEntries } from '../src/domain/transform.js';
import { getDirectorySchema } from '../src/schema/contract.js';
import { validatePublicRows } from '../src/schema/validate.js';
import { searchCatalog } from '../src/search/search.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const legacy = join(root, 'examples/legacy/flat-public');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadLegacy(name) {
  return JSON.parse(readFileSync(join(legacy, name), 'utf8'));
}

console.log('Running generic-engine regression tests…');

const schema = getDirectorySchema();

// --- schema / validation ---
{
  const valid = validatePublicRows(
    [
      { id: 'A', title: 'Alpha' },
      { id: 'B', title: 'Beta' },
    ],
    schema,
  );
  assert(valid.valid, 'valid flat rows pass');

  const missingId = validatePublicRows([{ title: 'No id' }], schema);
  assert(!missingId.valid, 'missing id fails');
  assert(
    missingId.errors.some((e) => e.code === 'missing_field' && e.field === 'id'),
    'missing id code',
  );

  const missingTitle = validatePublicRows(loadLegacy('sample-missing-title.json'), schema);
  assert(!missingTitle.valid, 'missing title fixture fails');
  assert(
    missingTitle.errors.some(
      (e) => e.code === 'missing_field' && e.field === 'title',
    ),
    'missing title code',
  );

  const badType = validatePublicRows(loadLegacy('sample-invalid-type.json'), schema);
  assert(!badType.valid, 'invalid type fixture fails');
  assert(
    badType.errors.some((e) => e.code === 'invalid_type'),
    'invalid type code',
  );

  const nonObject = validatePublicRows([null, 'x'], schema);
  assert(!nonObject.valid, 'non-object rows fail');
  assert(
    nonObject.errors.every((e) => e.code === 'not_object'),
    'not_object codes',
  );

  const dup = validatePublicRows(loadLegacy('sample-duplicate-id.json'), schema);
  assert(!dup.valid, 'duplicate id fails');
  assert(
    dup.errors.some((e) => e.code === 'duplicate_id'),
    'duplicate_id code',
  );
}

// --- transform ---
{
  const rows = [
    { id: 'REC-001', title: 'One' },
    { id: 'REC-002', title: 'Two' },
  ];
  const validation = validatePublicRows(rows, schema);
  assert(validation.valid, 'rows valid before transform');
  const entries = transformRowsToEntries(rows);
  assert(entries.length === 2, 'transform count');
  assert(entries[0].id === 'REC-001' && entries[1].title === 'Two', 'order/shape');
  assert(Object.isFrozen(entries[0]), 'entry frozen');
  assert(
    Object.keys(entries[0]).sort().join(',') === 'id,title',
    'flat domain shape',
  );
}

// --- Catalog defaults ---
{
  const entries = [
    createDirectoryEntry({ id: 'REC-001', title: 'First' }),
    createDirectoryEntry({ id: 'REC-002', title: 'Second' }),
  ];
  const catalog = createCatalog(entries);
  assert(catalog.size === 2, 'catalog size');
  assert(catalog.getById('REC-002') === entries[1], 'getById default accessors');
  assert(
    catalog.getAll().map((e) => e.id).join('|') === 'REC-001|REC-002',
    'catalog order',
  );

  const all = catalog.getAll();
  let mutated = false;
  try {
    all.push(createDirectoryEntry({ id: 'X', title: 'X' }));
    mutated = all.length === 3;
  } catch {
    /* frozen */
  }
  assert(!mutated && all.length === 2, 'catalog getAll immutable');

  let dupFailed = false;
  try {
    createCatalog([
      createDirectoryEntry({ id: 'SAME', title: 'A' }),
      createDirectoryEntry({ id: 'SAME', title: 'B' }),
    ]);
  } catch {
    dupFailed = true;
  }
  assert(dupFailed, 'duplicate id rejected');

  assert(
    flatRecordAccessors.getId(entries[0]) === 'REC-001',
    'flat accessor id',
  );
}

// --- Search defaults ---
{
  const catalog = createCatalog([
    createDirectoryEntry({ id: 'REC-001', title: 'Stress Regulation' }),
    createDirectoryEntry({ id: 'REC-002', title: 'Sample directory entry two' }),
    createDirectoryEntry({ id: 'REC-003', title: 'Coaching Basics' }),
  ]);

  const all = searchCatalog(catalog, { text: '' });
  assert(all.size === 3, 'empty query returns all');
  assert(
    Reflect.ownKeys(all).map(String).sort().join(',') === 'getAll,size',
    'SearchResult API',
  );
  assert(
    all.getAll().map((e) => e.id).join('|') === 'REC-001|REC-002|REC-003',
    'search order',
  );

  const caseHit = searchCatalog(catalog, { text: 'REGULATION' });
  assert(caseHit.size === 1 && caseHit.getAll()[0].id === 'REC-001', 'case');

  const trimmed = searchCatalog(catalog, { text: '  entry two  ' });
  assert(trimmed.size === 1 && trimmed.getAll()[0].id === 'REC-002', 'trim');

  const sub = searchCatalog(catalog, { text: 'coach' });
  assert(sub.size === 1 && sub.getAll()[0].id === 'REC-003', 'substring');

  const none = searchCatalog(catalog, { text: 'zzzz' });
  assert(none.size === 0, 'no match');

  const frozenAll = all.getAll();
  let mut = false;
  try {
    frozenAll.push({});
    mut = frozenAll.length === 4;
  } catch {
    /* frozen */
  }
  assert(!mut && frozenAll.length === 3, 'SearchResult immutable');
}

// --- projection ---
{
  const catalog = createCatalog([
    createDirectoryEntry({ id: 'A', title: 'Alpha' }),
    createDirectoryEntry({ id: 'B', title: 'Beta' }),
  ]);
  const result = searchCatalog(catalog, { text: 'a' });
  const projection = projectIdTitleResults(result, flatRecordAccessors);
  assert(projection.length >= 1, 'projection non-empty');
  assert(
    Object.keys(projection[0]).sort().join(',') === 'id,title',
    'projection shape',
  );
  assert(Object.isFrozen(projection), 'projection frozen');
  assert(Object.isFrozen(projection[0]), 'projection item frozen');
}

console.log('Generic-engine regression tests passed.');
