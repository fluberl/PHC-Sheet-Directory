/**
 * Interaction — Version 1.0 (Milestone 7)
 * Translates user intent inside the mount root into state commands.
 * Milestone 7: search input only.
 */

/**
 * @param {Element} root
 * @param {{ onSearchInput: (value: string) => void }} handlers
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

  root.addEventListener('input', onInput);

  return () => {
    root.removeEventListener('input', onInput);
  };
}
