/**
 * Application State — Version 1.0 (Milestone 7)
 * Owns mutable session lifecycle.
 * Retains Catalog (source), normalized search text, and SearchResult (derived).
 *
 * ---------------------------------------------------------------------------
 * Internal interfaces (not for Rendering)
 * ---------------------------------------------------------------------------
 * - getSnapshot()
 *     { lifecycle, errorMessage, rowCount, resultCount, searchText }
 * - getCatalog()
 * - getSearchResult()
 * - setSearchText(rawText) — re-derives SearchResult from Catalog
 * ---------------------------------------------------------------------------
 */

import {
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
 * @typedef {{ id: string, title: string }} DirectoryEntry
 *
 * @typedef {{
 *   readonly size: number,
 *   getAll: () => readonly DirectoryEntry[],
 *   getById: (id: string) => DirectoryEntry | null,
 * }} Catalog
 *
 * @typedef {{
 *   readonly size: number,
 *   getAll: () => readonly DirectoryEntry[],
 * }} SearchResult
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
 * @param {readonly DirectoryEntry[]} nextEntries
 * @returns {readonly DirectoryEntry[]}
 */
function retainEntries(nextEntries) {
  return Object.freeze(nextEntries.slice());
}

/**
 * @returns {{
 *   getSnapshot: () => StateSnapshot,
 *   getAcquiredRows: () => readonly unknown[] | null,
 *   getValidationResult: () => ValidationResult | null,
 *   getEntries: () => readonly DirectoryEntry[] | null,
 *   getCatalog: () => Catalog | null,
 *   getSearchResult: () => SearchResult | null,
 *   subscribe: (listener: (snapshot: StateSnapshot) => void) => () => void,
 *   setLoading: () => void,
 *   setEmpty: (details: {
 *     rows?: unknown[],
 *     validationResult?: ValidationResult,
 *     entries?: DirectoryEntry[],
 *     catalog: Catalog,
 *     searchResult: SearchResult,
 *     searchText?: string,
 *   }) => void,
 *   setReady: (details: {
 *     rows: unknown[],
 *     validationResult: ValidationResult,
 *     entries: DirectoryEntry[],
 *     catalog: Catalog,
 *     searchResult: SearchResult,
 *     searchText?: string,
 *   }) => void,
 *   setSearchText: (rawText: string) => void,
 *   setSchemaError: (details: {
 *     rows: unknown[],
 *     validationResult: ValidationResult,
 *     message: string,
 *   }) => void,
 *   setTransformError: (details: {
 *     rows: unknown[],
 *     validationResult: ValidationResult,
 *     message: string,
 *   }) => void,
 *   setCatalogError: (details: {
 *     rows: unknown[],
 *     validationResult: ValidationResult,
 *     entries: DirectoryEntry[],
 *     message: string,
 *   }) => void,
 *   setError: (message: string) => void,
 * }}
 */
export function createState() {
  /** @type {StateSnapshot} */
  let snapshot = Object.freeze({
    lifecycle: 'loading',
    errorMessage: null,
    rowCount: null,
    resultCount: null,
    searchText: '',
  });

  /** @type {readonly unknown[] | null} */
  let acquiredRows = null;

  /** @type {ValidationResult | null} */
  let validationResult = null;

  /** @type {readonly DirectoryEntry[] | null} */
  let entries = null;

  /** @type {Catalog | null} */
  let catalog = null;

  /** @type {SearchResult | null} */
  let searchResult = null;

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
      snapshot = Object.freeze({
        lifecycle: 'loading',
        errorMessage: null,
        rowCount: null,
        resultCount: null,
        searchText: '',
      });
      emit();
    },

    setEmpty(details) {
      const rows = details.rows ?? [];
      const nextValidation = details.validationResult ?? {
        valid: true,
        errors: [],
      };
      const nextEntries = details.entries ?? [];
      const text = normalizeSearchText(details.searchText ?? '');

      acquiredRows = retainRows(rows);
      validationResult = retainValidationResult(nextValidation);
      entries = retainEntries(nextEntries);
      catalog = details.catalog;
      searchResult = details.searchResult;
      snapshot = Object.freeze({
        lifecycle: 'empty',
        errorMessage: null,
        rowCount: details.catalog.size,
        resultCount: details.searchResult.size,
        searchText: text,
      });
      emit();
    },

    setReady(details) {
      const text = normalizeSearchText(details.searchText ?? '');

      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = retainEntries(details.entries);
      catalog = details.catalog;
      searchResult = details.searchResult;
      snapshot = Object.freeze({
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: details.catalog.size,
        resultCount: details.searchResult.size,
        searchText: text,
      });
      emit();
    },

    /**
     * Update search criterion and re-derive SearchResult from Catalog.
     * Does not change lifecycle when Catalog is non-empty (zero matches ≠ error).
     * @param {string} rawText
     */
    setSearchText(rawText) {
      if (!catalog || (snapshot.lifecycle !== 'ready' && snapshot.lifecycle !== 'empty')) {
        return;
      }

      const text = normalizeSearchText(rawText);
      searchResult = searchCatalog(catalog, { text });
      snapshot = Object.freeze({
        lifecycle: snapshot.lifecycle,
        errorMessage: null,
        rowCount: catalog.size,
        resultCount: searchResult.size,
        searchText: text,
      });
      emit();
    },

    setSchemaError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = null;
      catalog = null;
      searchResult = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
        resultCount: null,
        searchText: '',
      });
      emit();
    },

    setTransformError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = null;
      catalog = null;
      searchResult = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
        resultCount: null,
        searchText: '',
      });
      emit();
    },

    setCatalogError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = retainEntries(details.entries);
      catalog = null;
      searchResult = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
        resultCount: null,
        searchText: '',
      });
      emit();
    },

    setError(message) {
      acquiredRows = null;
      validationResult = null;
      entries = null;
      catalog = null;
      searchResult = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: message,
        rowCount: null,
        resultCount: null,
        searchText: '',
      });
      emit();
    },
  };
}
