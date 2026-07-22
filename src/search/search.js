/**
 * Search — Version 1.0 (Milestone 14)
 * Pure function: Catalog + criteria → immutable SearchResult.
 *
 * Text and optional category id are read through RecordAccessors.
 * Does not import specializations or know taxonomy labels.
 *
 * Category matching prefers getCategoryIds (multi-category) when provided,
 * otherwise falls back to getPrimaryCategoryId.
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
 * @typedef {{
 *   text?: string | null,
 *   categoryId?: string | null,
 * }} SearchCriteria
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
 * @param {unknown} categoryId
 * @returns {string}
 */
export function normalizeCategoryId(categoryId) {
  if (typeof categoryId !== 'string') {
    return '';
  }

  return categoryId.trim();
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
 * @param {unknown} entry
 * @param {RecordAccessors} accessors
 * @returns {string}
 */
function searchableTextFor(entry, accessors) {
  if (typeof accessors.getSearchableText === 'function') {
    const text = accessors.getSearchableText(entry);
    return typeof text === 'string' ? text : '';
  }

  const title = accessors.getTitle(entry);
  return typeof title === 'string' ? title : '';
}

/**
 * @param {unknown} entry
 * @param {string} categoryId
 * @param {RecordAccessors} accessors
 * @returns {boolean}
 */
function entryMatchesCategory(entry, categoryId, accessors) {
  if (typeof accessors.getCategoryIds === 'function') {
    const ids = accessors.getCategoryIds(entry);
    return Array.isArray(ids) && ids.includes(categoryId);
  }

  if (typeof accessors.getPrimaryCategoryId === 'function') {
    return accessors.getPrimaryCategoryId(entry) === categoryId;
  }

  return false;
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
  const categoryId = normalizeCategoryId(criteria?.categoryId);
  const needle = text === '' ? '' : text.toLowerCase();

  if (
    categoryId !== '' &&
    typeof accessors.getCategoryIds !== 'function' &&
    typeof accessors.getPrimaryCategoryId !== 'function'
  ) {
    throw new Error(
      'searchCatalog failed: category filtering requires getCategoryIds or getPrimaryCategoryId accessor.',
    );
  }

  /** @type {unknown[]} */
  const matched = [];

  for (const entry of source) {
    if (categoryId !== '' && !entryMatchesCategory(entry, categoryId, accessors)) {
      continue;
    }

    if (needle !== '') {
      const haystack = searchableTextFor(entry, accessors).toLowerCase();
      if (!haystack.includes(needle)) {
        continue;
      }
    }

    matched.push(entry);
  }

  return createSearchResult(matched);
}
