/**
 * Application State — Version 1.0 (Milestone 8)
 * Retains Catalog, SearchResult, record accessors, and rendering snapshot.
 * Does not retain raw PUBLIC rows on successful load.
 */

import {
  projectIdTitleResults,
} from '../domain/accessors.js';
import {
  normalizeSearchText,
  searchCatalog,
} from '../search/search.js';

/**
 * @typedef {'loading' | 'empty' | 'ready' | 'error'} Lifecycle
 * @typedef {{
 *   id: string,
 *   title: string,
 * }} ResultProjection
 * @typedef {{
 *   lifecycle: Lifecycle,
 *   errorMessage: string | null,
 *   rowCount: number | null,
 *   resultCount: number | null,
 *   searchText: string,
 *   results: readonly ResultProjection[],
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
   * @returns {readonly ResultProjection[]}
   */
  function buildResults(nextSearchResult, accessors) {
    return projectIdTitleResults(nextSearchResult, accessors);
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
      const accessors = details.recordAccessors;
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
        results,
      });
      emit();
    },

    setReady(details) {
      const text = normalizeSearchText(details.searchText ?? '');
      const accessors = details.recordAccessors;
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

      const text = normalizeSearchText(rawText);
      searchResult = searchCatalog(catalog, { text }, recordAccessors);
      const results = buildResults(searchResult, recordAccessors);
      snapshot = Object.freeze({
        lifecycle: snapshot.lifecycle,
        errorMessage: null,
        rowCount: catalog.size,
        resultCount: searchResult.size,
        searchText: text,
        results,
      });
      emit();
    },

    setSchemaError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = null;
      catalog = null;
      searchResult = null;
      recordAccessors = null;
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
