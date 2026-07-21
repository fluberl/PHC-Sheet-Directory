/**
 * Application State — Version 1.0 (Milestone 6)
 * Owns mutable session lifecycle.
 * Retains acquired rows, Validation Results, Domain Entries, and Catalog internally.
 * Does not know about DOM, fetch, or presentation layout.
 *
 * ---------------------------------------------------------------------------
 * Internal interfaces (not for Rendering)
 * ---------------------------------------------------------------------------
 * - getSnapshot()
 *     { lifecycle, errorMessage, rowCount }
 *
 * - getAcquiredRows()
 * - getValidationResult()
 * - getEntries()
 * - getCatalog()
 *     Catalog after successful creation:
 *       - ready / empty → Catalog instance
 *       - loading / transport-error / schema-error / transform-error /
 *         catalog-error → null
 * ---------------------------------------------------------------------------
 */

/**
 * @typedef {'loading' | 'empty' | 'ready' | 'error'} Lifecycle
 * @typedef {{
 *   lifecycle: Lifecycle,
 *   errorMessage: string | null,
 *   rowCount: number | null,
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
 *   subscribe: (listener: (snapshot: StateSnapshot) => void) => () => void,
 *   setLoading: () => void,
 *   setEmpty: (details: {
 *     rows?: unknown[],
 *     validationResult?: ValidationResult,
 *     entries?: DirectoryEntry[],
 *     catalog: Catalog,
 *   }) => void,
 *   setReady: (details: {
 *     rows: unknown[],
 *     validationResult: ValidationResult,
 *     entries: DirectoryEntry[],
 *     catalog: Catalog,
 *   }) => void,
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
  });

  /** @type {readonly unknown[] | null} */
  let acquiredRows = null;

  /** @type {ValidationResult | null} */
  let validationResult = null;

  /** @type {readonly DirectoryEntry[] | null} */
  let entries = null;

  /** @type {Catalog | null} */
  let catalog = null;

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
      snapshot = Object.freeze({
        lifecycle: 'loading',
        errorMessage: null,
        rowCount: null,
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

      acquiredRows = retainRows(rows);
      validationResult = retainValidationResult(nextValidation);
      entries = retainEntries(nextEntries);
      catalog = details.catalog;
      snapshot = Object.freeze({
        lifecycle: 'empty',
        errorMessage: null,
        rowCount: details.catalog.size,
      });
      emit();
    },

    setReady(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = retainEntries(details.entries);
      catalog = details.catalog;
      snapshot = Object.freeze({
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: details.catalog.size,
      });
      emit();
    },

    setSchemaError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = null;
      catalog = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
      });
      emit();
    },

    setTransformError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = null;
      catalog = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
      });
      emit();
    },

    setCatalogError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = retainEntries(details.entries);
      catalog = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
      });
      emit();
    },

    setError(message) {
      acquiredRows = null;
      validationResult = null;
      entries = null;
      catalog = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: message,
        rowCount: null,
      });
      emit();
    },
  };
}
