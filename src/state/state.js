/**
 * Application State — Version 1.0 (Milestone 3)
 * Owns mutable session lifecycle and retains the acquired PUBLIC payload internally.
 * Does not know about DOM, fetch, or presentation layout.
 *
 * ---------------------------------------------------------------------------
 * Internal interface for Milestone 4 (Validation)
 * ---------------------------------------------------------------------------
 * After a successful PUBLIC acquisition, raw rows are retained in memory.
 *
 * - getSnapshot()
 *     Public render snapshot only: { lifecycle, errorMessage, rowCount }.
 *     Never includes raw rows.
 *
 * - getAcquiredRows()
 *     Returns the retained raw PUBLIC rows from the current successful load:
 *       - ready  → non-empty frozen array
 *       - empty  → frozen empty array
 *       - loading / error → null (no successful acquisition to validate)
 *
 * Milestone 4 must call getAcquiredRows() on the state API. It must not
 * re-fetch PUBLIC, read the DOM, or receive rows through Rendering.
 * ---------------------------------------------------------------------------
 */

/**
 * @typedef {'loading' | 'empty' | 'ready' | 'error'} Lifecycle
 * @typedef {{
 *   lifecycle: Lifecycle,
 *   errorMessage: string | null,
 *   rowCount: number | null,
 * }} StateSnapshot
 */

/**
 * @returns {{
 *   getSnapshot: () => StateSnapshot,
 *   getAcquiredRows: () => readonly unknown[] | null,
 *   subscribe: (listener: (snapshot: StateSnapshot) => void) => () => void,
 *   setLoading: () => void,
 *   setEmpty: (rows?: unknown[]) => void,
 *   setReady: (details: { rows: unknown[] }) => void,
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

    /**
     * Raw PUBLIC rows from the last successful acquisition.
     * For Milestone 4 Validation — not for Rendering.
     */
    getAcquiredRows() {
      return acquiredRows;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    setLoading() {
      acquiredRows = null;
      snapshot = Object.freeze({
        lifecycle: 'loading',
        errorMessage: null,
        rowCount: null,
      });
      emit();
    },

    setEmpty(rows = []) {
      acquiredRows = retainRows(rows);
      snapshot = Object.freeze({
        lifecycle: 'empty',
        errorMessage: null,
        rowCount: 0,
      });
      emit();
    },

    setReady(details) {
      acquiredRows = retainRows(details.rows);
      snapshot = Object.freeze({
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: details.rows.length,
      });
      emit();
    },

    setError(message) {
      acquiredRows = null;
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: message,
        rowCount: null,
      });
      emit();
    },
  };
}
