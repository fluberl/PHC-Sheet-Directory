/**
 * Search — Version 1.0 (Milestone 7)
 * Pure function: Catalog + criteria → immutable SearchResult.
 *
 * Does not mutate Catalog. No filtering, sorting, ranking, or fuzzy match.
 * Searches the generic title field with case-insensitive substring matching.
 */

import { createSearchResult } from './result.js';

/**
 * @typedef {{ id: string, title: string }} DirectoryEntry
 *
 * @typedef {{
 *   readonly size: number,
 *   getAll: () => readonly DirectoryEntry[],
 *   getById: (id: string) => DirectoryEntry | null,
 * }} Catalog
 *
 * @typedef {{ text?: string | null }} SearchCriteria
 */

/**
 * Normalize search text: trim; missing/null/non-string → empty string.
 *
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
 * Search a Catalog and return an immutable SearchResult.
 *
 * Empty / whitespace-only text → all Catalog entries (source order).
 * Otherwise → case-insensitive substring match on title.
 *
 * @param {Catalog} catalog
 * @param {SearchCriteria} [criteria]
 * @returns {import('./result.js').SearchResult}
 */
export function searchCatalog(catalog, criteria = {}) {
  assertCatalog(catalog);

  const source = catalog.getAll();

  if (!Array.isArray(source)) {
    throw new Error('searchCatalog failed: Catalog.getAll() must return an array.');
  }

  const text = normalizeSearchText(criteria?.text);

  if (text === '') {
    return createSearchResult(source);
  }

  const needle = text.toLowerCase();
  /** @type {DirectoryEntry[]} */
  const matched = [];

  for (const entry of source) {
    if (typeof entry?.title === 'string' && entry.title.toLowerCase().includes(needle)) {
      matched.push(entry);
    }
  }

  return createSearchResult(matched);
}
