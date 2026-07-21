/**
 * Application State — Version 1.0 (Milestone 2)
 * Owns mutable session lifecycle. Does not know about DOM, fetch, or presentation layout.
 */

/**
 * @typedef {'loading' | 'empty' | 'error'} Lifecycle
 * @typedef {{ lifecycle: Lifecycle, errorMessage: string | null }} StateSnapshot
 */

/**
 * @returns {{
 *   getSnapshot: () => StateSnapshot,
 *   subscribe: (listener: (snapshot: StateSnapshot) => void) => () => void,
 *   setLoading: () => void,
 *   setEmpty: () => void,
 *   setError: (message: string) => void,
 * }}
 */
export function createState() {
  /** @type {StateSnapshot} */
  let snapshot = Object.freeze({
    lifecycle: 'loading',
    errorMessage: null,
  });

  /** @type {Set<(snapshot: StateSnapshot) => void>} */
  const listeners = new Set();

  function emit() {
    const current = snapshot;
    listeners.forEach((listener) => {
      listener(current);
    });
  }

  return {
    getSnapshot() {
      return snapshot;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    setLoading() {
      snapshot = Object.freeze({
        lifecycle: 'loading',
        errorMessage: null,
      });
      emit();
    },

    setEmpty() {
      snapshot = Object.freeze({
        lifecycle: 'empty',
        errorMessage: null,
      });
      emit();
    },

    setError(message) {
      snapshot = Object.freeze({
        lifecycle: 'error',
        errorMessage: message,
      });
      emit();
    },
  };
}
