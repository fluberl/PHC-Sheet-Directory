/**
 * Search — Version 1.0 (Milestone 8)
 * Pure function: Catalog + criteria → immutable SearchResult.
 *
 * Title text is read through RecordAccessors (default: flat entry.title).
 * Does not import specializations or know PUBLIC column headings.
 */

import { flatRecordAccessors } from '../domain/accessors.js';
import { createSearchResult } from './result.js';

/**
 * @typedef {import('../domain/accessors.js').RecordAccessors} RecordAccessors
 *
 * @typedef {{
 *   readonly size: number,
 *   getAll: () => readonly unknown[],
 *   getById: (id: string) => unknown | null,
 * }} Catalog
 *
 * @typedef {{ text?: string | null }} SearchCriteria
 */

/**
 * @param {unknown} text
 * @returns {string}
 */
export function normalizeSearchText(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return text.trim();
}

/**
 * @param {unknown} catalog
 * @returns {asserts catalog is Catalog}
 */
function assertCatalog(catalog) {
  if (
    catalog === null ||
    typeof catalog !== 'object' ||
    typeof catalog.getAll !== 'function' ||
    typeof catalog.size !== 'number'
  ) {
    throw new Error('searchCatalog failed: expected a Catalog.');
  }
}

/**
 * @param {Catalog} catalog
 * @param {SearchCriteria} [criteria]
 * @param {RecordAccessors} [accessors]
 * @returns {import('./result.js').SearchResult}
 */
export function searchCatalog(
  catalog,
  criteria = {},
  accessors = flatRecordAccessors,
) {
  assertCatalog(catalog);

  if (
    accessors === null ||
    typeof accessors !== 'object' ||
    typeof accessors.getTitle !== 'function'
  ) {
    throw new Error('searchCatalog failed: expected record accessors.');
  }

  const source = catalog.getAll();

  if (!Array.isArray(source)) {
    throw new Error('searchCatalog failed: Catalog.getAll() must return an array.');
  }

  const text = normalizeSearchText(criteria?.text);

  if (text === '') {
    return createSearchResult(source);
  }

  const needle = text.toLowerCase();
  /** @type {unknown[]} */
  const matched = [];

  for (const entry of source) {
    const title = accessors.getTitle(entry);
    if (typeof title === 'string' && title.toLowerCase().includes(needle)) {
      matched.push(entry);
    }
  }

  return createSearchResult(matched);
}
