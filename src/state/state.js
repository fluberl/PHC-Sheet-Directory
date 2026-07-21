/**
 * Application State — Version 1.0 (Milestone 10)
 * Retains Catalog, SearchResult, accessors, discovery criteria, and snapshot.
 * Does not retain raw PUBLIC rows on successful load.
 */

import {
  projectIdTitleResults,
} from '../domain/accessors.js';
import {
  normalizeCategoryId,
  normalizeSearchText,
  searchCatalog,
} from '../search/search.js';

/**
 * @typedef {'loading' | 'empty' | 'ready' | 'error'} Lifecycle
 * @typedef {{
 *   lifecycle: Lifecycle,
 *   errorMessage: string | null,
 *   rowCount: number | null,
 *   resultCount: number | null,
 *   searchText: string,
 *   categoryId: string,
 *   results: readonly unknown[],
 * }} StateSnapshot
 *
 * @typedef {{
 *   valid: boolean,
 *   errors: readonly {
 *     row: number,
 *     field: string,
 *     code: string,
 *     message: string,
 *   }[],
 * }} ValidationResult
 *
 * @typedef {import('../domain/accessors.js').RecordAccessors} RecordAccessors
 * @typedef {(
 *   searchResult: import('../search/result.js').SearchResult,
 *   accessors: RecordAccessors,
 * ) => readonly unknown[]} ResultProjector
 */

/**
 * @param {ValidationResult} result
 * @returns {ValidationResult}
 */
function retainValidationResult(result) {
  return Object.freeze({
    valid: result.valid,
    errors: Object.freeze(
      result.errors.map((error) =>
        Object.freeze({
          row: error.row,
          field: error.field,
          code: error.code,
          message: error.message,
        }),
      ),
    ),
  });
}

/**
 * @param {readonly unknown[]} nextEntries
 * @returns {readonly unknown[]}
 */
function retainEntries(nextEntries) {
  return Object.freeze(nextEntries.slice());
}

function emptySnapshotExtras() {
  return {
    resultCount: null,
    searchText: '',
    categoryId: '',
    results: Object.freeze([]),
  };
}

/**
 * @returns {ReturnType<typeof createStateApi>}
 */
export function createState() {
  return createStateApi();
}

function createStateApi() {
  /** @type {StateSnapshot} */
  let snapshot = Object.freeze({
    lifecycle: 'loading',
    errorMessage: null,
    rowCount: null,
    ...emptySnapshotExtras(),
  });

  /** @type {readonly unknown[] | null} */
  let acquiredRows = null;

  /** @type {ValidationResult | null} */
  let validationResult = null;

  /** @type {readonly unknown[] | null} */
  let entries = null;

  /** @type {import('../catalog/catalog.js').Catalog | null} */
  let catalog = null;

  /** @type {import('../search/result.js').SearchResult | null} */
  let searchResult = null;

  /** @type {RecordAccessors | null} */
  let recordAccessors = null;

  /** @type {ResultProjector | null} */
  let projectResults = null;

  /** @type {Set<(snapshot: StateSnapshot) => void>} */
  const listeners = new Set();

  function emit() {
    const current = snapshot;
    listeners.forEach((listener) => {
      listener(current);
    });
  }

  /**
   * @param {unknown[]} rows
   * @returns {readonly unknown[]}
   */
  function retainRows(rows) {
    return Object.freeze(rows.slice());
  }

  /**
   * @param {import('../search/result.js').SearchResult} nextSearchResult
   * @param {RecordAccessors} accessors
   * @returns {readonly unknown[]}
   */
  function buildResults(nextSearchResult, accessors) {
    if (typeof projectResults === 'function') {
      return projectResults(nextSearchResult, accessors);
    }

    return projectIdTitleResults(nextSearchResult, accessors);
  }

  /**
   * @param {string} text
   * @param {string} categoryId
   */
  function applyDiscovery(text, categoryId) {
    if (!catalog || !recordAccessors) {
      return;
    }

    searchResult = searchCatalog(
      catalog,
      { text, categoryId },
      recordAccessors,
    );
    const results = buildResults(searchResult, recordAccessors);
    snapshot = Object.freeze({
      lifecycle: snapshot.lifecycle,
      errorMessage: null,
      rowCount: catalog.size,
      resultCount: searchResult.size,
      searchText: text,
      categoryId,
      results,
    });
    emit();
  }

  return {
    getSnapshot() {
      return snapshot;
    },

    getAcquiredRows() {
      return acquiredRows;
    },

    getValidationResult() {
      return validationResult;
    },

    getEntries() {
      return entries;
    },

    getCatalog() {
      return catalog;
    },

    getSearchResult() {
      return searchResult;
    },

    getRecordAccessors() {
      return recordAccessors;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    setLoading() {
      acquiredRows = null;
      validationResult = null;
      entries = null;
      catalog = null;
      searchResult = null;
      recordAccessors = null;
      projectResults = null;
      snapshot = Object.freeze({
        lifecycle: 'loading',
        errorMessage: null,
        rowCount: null,
        ...emptySnapshotExtras(),
      });
      emit();
    },

    setEmpty(details) {
      const text = normalizeSearchText(details.searchText ?? '');
      const categoryId = normalizeCategoryId(details.categoryId ?? '');
      const accessors = details.recordAccessors;
      projectResults =
        typeof details.projectResults === 'function'
          ? details.projectResults
          : null;
      const results = buildResults(details.searchResult, accessors);

      acquiredRows = null;
      validationResult = retainValidationResult(
        details.validationResult ?? { valid: true, errors: [] },
      );
      entries = retainEntries(details.entries ?? []);
      catalog = details.catalog;
      searchResult = details.searchResult;
      recordAccessors = accessors;
      snapshot = Object.freeze({
        lifecycle: 'empty',
        errorMessage: null,
        rowCount: details.catalog.size,
        resultCount: details.searchResult.size,
        searchText: text,
        categoryId,
        results,
      });
      emit();
    },

    setReady(details) {
      const text = normalizeSearchText(details.searchText ?? '');
      const categoryId = normalizeCategoryId(details.categoryId ?? '');
      const accessors = details.recordAccessors;
      projectResults =
        typeof details.projectResults === 'function'
          ? details.projectResults
          : null;
      const results = buildResults(details.searchResult, accessors);

      acquiredRows = null;
      validationResult = retainValidationResult(details.validationResult);
      entries = retainEntries(details.entries);
      catalog = details.catalog;
      searchResult = details.searchResult;
      recordAccessors = accessors;
      snapshot = Object.freeze({
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: details.catalog.size,
        resultCount: details.searchResult.size,
        searchText: text,
        categoryId,
        results,
      });
      emit();
    },

    setSearchText(rawText) {
      if (
        !catalog ||
        !recordAccessors ||
        (snapshot.lifecycle !== 'ready' && snapshot.lifecycle !== 'empty')
      ) {
        return;
      }

      applyDiscovery(normalizeSearchText(rawText), snapshot.categoryId);
    },

    setCategoryId(rawCategoryId) {
      if (
        !catalog ||
        !recordAccessors ||
        (snapshot.lifecycle !== 'ready' && snapshot.lifecycle !== 'empty')
      ) {
        return;
      }

      applyDiscovery(snapshot.searchText, normalizeCategoryId(rawCategoryId));
    },

    setSchemaError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = null;
      catalog = null;
      searchResult = null;
      recordAccessors = null;
      projectResults = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
        ...emptySnapshotExtras(),
      });
      emit();
    },

    setTransformError(details) {
      acquiredRows = retainRows(details.rows ?? []);
      validationResult = details.validationResult
        ? retainValidationResult(details.validationResult)
        : null;
      entries = null;
      catalog = null;
      searchResult = null;
      recordAccessors = null;
      projectResults = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
        ...emptySnapshotExtras(),
      });
      emit();
    },

    setCatalogError(details) {
      acquiredRows = null;
      validationResult = details.validationResult
        ? retainValidationResult(details.validationResult)
        : null;
      entries = retainEntries(details.entries);
      catalog = null;
      searchResult = null;
      recordAccessors = null;
      projectResults = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
        ...emptySnapshotExtras(),
      });
      emit();
    },

    setError(message) {
      acquiredRows = null;
      validationResult = null;
      entries = null;
      catalog = null;
      searchResult = null;
      recordAccessors = null;
      projectResults = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: message,
        rowCount: null,
        ...emptySnapshotExtras(),
      });
      emit();
    },
  };
}
