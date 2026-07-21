/**
 * Application State — Version 1.0 (Milestone 5)
 * Owns mutable session lifecycle.
 * Retains acquired PUBLIC rows, Validation Results, and Domain Entries internally.
 * Does not know about DOM, fetch, or presentation layout.
 *
 * ---------------------------------------------------------------------------
 * Internal interfaces (not for Rendering)
 * ---------------------------------------------------------------------------
 * - getSnapshot()
 *     { lifecycle, errorMessage, rowCount }
 *
 * - getAcquiredRows()
 *     Raw PUBLIC rows after successful acquisition (or schema/transform error).
 *
 * - getValidationResult()
 *     Last structural Validation Result, or null before validation.
 *
 * - getEntries()
 *     Transformed Domain Entries after successful transformation:
 *       - ready → frozen non-empty array
 *       - empty → frozen empty array
 *       - loading / transport-error / schema-error / transform-error → null
 *
 * ValidationError.row is zero-based; user-facing messages use one-based rows.
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
 * @param {readonly DirectoryEntry[]} entries
 * @returns {readonly DirectoryEntry[]}
 */
function retainEntries(entries) {
  return Object.freeze(entries.slice());
}

/**
 * @returns {{
 *   getSnapshot: () => StateSnapshot,
 *   getAcquiredRows: () => readonly unknown[] | null,
 *   getValidationResult: () => ValidationResult | null,
 *   getEntries: () => readonly DirectoryEntry[] | null,
 *   subscribe: (listener: (snapshot: StateSnapshot) => void) => () => void,
 *   setLoading: () => void,
 *   setEmpty: (details: {
 *     rows?: unknown[],
 *     validationResult?: ValidationResult,
 *     entries?: DirectoryEntry[],
 *   }) => void,
 *   setReady: (details: {
 *     rows: unknown[],
 *     validationResult: ValidationResult,
 *     entries: DirectoryEntry[],
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
      snapshot = Object.freeze({
        lifecycle: 'loading',
        errorMessage: null,
        rowCount: null,
      });
      emit();
    },

    setEmpty(details = {}) {
      const rows = details.rows ?? [];
      const nextValidation = details.validationResult ?? {
        valid: true,
        errors: [],
      };
      const nextEntries = details.entries ?? [];

      acquiredRows = retainRows(rows);
      validationResult = retainValidationResult(nextValidation);
      entries = retainEntries(nextEntries);
      snapshot = Object.freeze({
        lifecycle: 'empty',
        errorMessage: null,
        rowCount: 0,
      });
      emit();
    },

    setReady(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = retainEntries(details.entries);
      snapshot = Object.freeze({
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: details.entries.length,
      });
      emit();
    },

    /**
     * Structural schema validation failed after PUBLIC acquisition.
     */
    setSchemaError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
      });
      emit();
    },

    /**
     * Domain transformation failed after successful structural validation.
     */
    setTransformError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
      entries = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: details.message,
        rowCount: null,
      });
      emit();
    },

    /**
     * Transport / acquisition failure (no reliable PUBLIC rows).
     */
    setError(message) {
      acquiredRows = null;
      validationResult = null;
      entries = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: message,
        rowCount: null,
      });
      emit();
    },
  };
}
