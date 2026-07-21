/**
 * Rendering — Version 1.0 (Milestone 9)
 * Snapshot-only. No Catalog, SearchResult, mapper, or CPD imports.
 * Preserves search-field focus across remounts.
 */

import { createLifecycleView } from './states.js';

/**
 * @param {unknown} node
 * @returns {boolean}
 */
function isSearchInput(node) {
  return Boolean(
    node &&
      typeof node === 'object' &&
      typeof /** @type {{ matches?: unknown }} */ (node).matches ===
        'function' &&
      /** @type {{ matches: (selector: string) => boolean }} */ (node).matches(
        '[data-phc-search]',
      ),
  );
}

/**
 * @param {Element} root
 * @returns {{
 *   restore: boolean,
 *   selectionStart: number | null,
 *   selectionEnd: number | null,
 * }}
 */
function captureSearchFocus(root) {
  const active =
    typeof document !== 'undefined' ? document.activeElement : null;

  if (
    !isSearchInput(active) ||
    typeof root.contains !== 'function' ||
    !root.contains(/** @type {Node} */ (active))
  ) {
    return {
      restore: false,
      selectionStart: null,
      selectionEnd: null,
    };
  }

  const input = /** @type {{ selectionStart?: number | null, selectionEnd?: number | null }} */ (
    active
  );

  return {
    restore: true,
    selectionStart:
      typeof input.selectionStart === 'number' ? input.selectionStart : null,
    selectionEnd:
      typeof input.selectionEnd === 'number' ? input.selectionEnd : null,
  };
}

/**
 * @param {Element} root
 * @param {{
 *   restore: boolean,
 *   selectionStart: number | null,
 *   selectionEnd: number | null,
 * }} focus
 */
function restoreSearchFocus(root, focus) {
  if (!focus.restore || typeof root.querySelector !== 'function') {
    return;
  }

  const input = root.querySelector('[data-phc-search]');
  if (!isSearchInput(input)) {
    return;
  }

  const field = /** @type {{
 *   focus?: () => void,
 *   setSelectionRange?: (start: number, end: number) => void,
 * }} */ (input);

  if (typeof field.focus === 'function') {
    field.focus();
  }

  if (
    focus.selectionStart != null &&
    focus.selectionEnd != null &&
    typeof field.setSelectionRange === 'function'
  ) {
    try {
      field.setSelectionRange(focus.selectionStart, focus.selectionEnd);
    } catch {
      /* some input types may reject selection APIs */
    }
  }
}

/**
 * @param {Element} root
 * @param {object} snapshot
 * @param {{
 *   copy?: object,
 *   renderResults?: (snapshot: object) => HTMLElement | null,
 * }} [options]
 */
export function render(root, snapshot, options = {}) {
  const focus = captureSearchFocus(root);

  root.replaceChildren();

  const app = document.createElement('div');
  app.className = 'phc-directory';
  app.appendChild(createLifecycleView(snapshot, options));

  root.appendChild(app);
  restoreSearchFocus(root, focus);
}
