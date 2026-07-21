/**
 * Application State — Version 1.0 (Milestone 4)
 * Owns mutable session lifecycle.
 * Retains acquired PUBLIC rows and Validation Results internally.
 * Does not know about DOM, fetch, or presentation layout.
 *
 * ---------------------------------------------------------------------------
 * Internal interfaces (not for Rendering)
 * ---------------------------------------------------------------------------
 * - getSnapshot()
 *     { lifecycle, errorMessage, rowCount }
 *
 * - getAcquiredRows()
 *     Raw PUBLIC rows after successful acquisition:
 *       - ready / empty / schema-error → frozen array (possibly empty)
 *       - loading / transport-error → null
 *
 * - getValidationResult()
 *     Last structural Validation Result, or null when none applies
 *     (loading / transport failure before validation).
 *     Not exposed to Rendering.
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
 * @returns {{
 *   getSnapshot: () => StateSnapshot,
 *   getAcquiredRows: () => readonly unknown[] | null,
 *   getValidationResult: () => ValidationResult | null,
 *   subscribe: (listener: (snapshot: StateSnapshot) => void) => () => void,
 *   setLoading: () => void,
 *   setEmpty: (rows?: unknown[], validationResult?: ValidationResult) => void,
 *   setReady: (details: { rows: unknown[], validationResult: ValidationResult }) => void,
 *   setSchemaError: (details: {
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

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    setLoading() {
      acquiredRows = null;
      validationResult = null;
      snapshot = Object.freeze({
        lifecycle: 'loading',
        errorMessage: null,
        rowCount: null,
      });
      emit();
    },

    setEmpty(rows = [], nextValidation = { valid: true, errors: [] }) {
      acquiredRows = retainRows(rows);
      validationResult = retainValidationResult(nextValidation);
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
      snapshot = Object.freeze({
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: details.rows.length,
      });
      emit();
    },

    /**
     * Structural schema validation failed after PUBLIC acquisition.
     * Retains rows and the full Validation Result for later milestones.
     */
    setSchemaError(details) {
      acquiredRows = retainRows(details.rows);
      validationResult = retainValidationResult(details.validationResult);
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
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: message,
        rowCount: null,
      });
      emit();
    },
  };
}
