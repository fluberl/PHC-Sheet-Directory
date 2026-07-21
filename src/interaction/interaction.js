/**
 * Interaction — Version 1.0 (Milestone 10)
 * Translates user intent inside the mount root into state commands.
 */

/**
 * @param {Element} root
 * @param {{
 *   onSearchInput: (value: string) => void,
 *   onCategoryChange?: (value: string) => void,
 * }} handlers
 * @returns {() => void} unbind
 */
export function bind(root, handlers) {
  /**
   * @param {Event} event
   */
  function onInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (!target.matches('[data-phc-search]')) {
      return;
    }

    handlers.onSearchInput(target.value);
  }

  /**
   * @param {Event} event
   */
  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    if (!target.matches('[data-phc-category]')) {
      return;
    }

    if (typeof handlers.onCategoryChange === 'function') {
      handlers.onCategoryChange(target.value);
    }
  }

  root.addEventListener('input', onInput);
  root.addEventListener('change', onChange);

  return () => {
    root.removeEventListener('input', onInput);
    root.removeEventListener('change', onChange);
  };
}
