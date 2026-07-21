/**
 * Rendering — Version 1.0 (Milestone 11)
 * Snapshot-only. No Catalog, SearchResult, mapper, or CPD imports.
 * Preserves search, category, and view control focus across remounts.
 */

import { createLifecycleView } from './states.js';

/**
 * @param {unknown} node
 * @param {string} selector
 * @returns {boolean}
 */
function matchesSelector(node, selector) {
  return Boolean(
    node &&
      typeof node === 'object' &&
      typeof /** @type {{ matches?: unknown }} */ (node).matches ===
        'function' &&
      /** @type {{ matches: (selector: string) => boolean }} */ (node).matches(
        selector,
      ),
  );
}

/**
 * @param {Element} root
 * @returns {{
 *   kind: 'search' | 'category' | 'view' | null,
 *   selectionStart: number | null,
 *   selectionEnd: number | null,
 *   value: string | null,
 * }}
 */
function captureControlFocus(root) {
  const active =
    typeof document !== 'undefined' ? document.activeElement : null;

  if (
    !active ||
    typeof root.contains !== 'function' ||
    !root.contains(/** @type {Node} */ (active))
  ) {
    return {
      kind: null,
      selectionStart: null,
      selectionEnd: null,
      value: null,
    };
  }

  if (matchesSelector(active, '[data-phc-search]')) {
    const input = /** @type {{ selectionStart?: number | null, selectionEnd?: number | null, value?: string }} */ (
      active
    );
    return {
      kind: 'search',
      selectionStart:
        typeof input.selectionStart === 'number' ? input.selectionStart : null,
      selectionEnd:
        typeof input.selectionEnd === 'number' ? input.selectionEnd : null,
      value: typeof input.value === 'string' ? input.value : null,
    };
  }

  if (matchesSelector(active, '[data-phc-category]')) {
    const select = /** @type {{ value?: string }} */ (active);
    return {
      kind: 'category',
      selectionStart: null,
      selectionEnd: null,
      value: typeof select.value === 'string' ? select.value : null,
    };
  }

  if (matchesSelector(active, '[data-phc-view]')) {
    const select = /** @type {{ value?: string }} */ (active);
    return {
      kind: 'view',
      selectionStart: null,
      selectionEnd: null,
      value: typeof select.value === 'string' ? select.value : null,
    };
  }

  return {
    kind: null,
    selectionStart: null,
    selectionEnd: null,
    value: null,
  };
}

/**
 * @param {Element} root
 * @param {{
 *   kind: 'search' | 'category' | 'view' | null,
 *   selectionStart: number | null,
 *   selectionEnd: number | null,
 *   value: string | null,
 * }} focus
 */
function restoreControlFocus(root, focus) {
  if (!focus.kind || typeof root.querySelector !== 'function') {
    return;
  }

  const selector =
    focus.kind === 'search'
      ? '[data-phc-search]'
      : focus.kind === 'category'
        ? '[data-phc-category]'
        : '[data-phc-view]';
  const control = root.querySelector(selector);
  if (!matchesSelector(control, selector)) {
    return;
  }

  const field = /** @type {{
 *   focus?: () => void,
 *   setSelectionRange?: (start: number, end: number) => void,
 * }} */ (control);

  if (typeof field.focus === 'function') {
    field.focus();
  }

  if (
    focus.kind === 'search' &&
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
 *   categoryOptions?: readonly { id: string, label: string }[],
 *   viewModeOptions?: readonly { id: string, label: string }[],
 *   renderResults?: (snapshot: object) => HTMLElement | null,
 * }} [options]
 */
export function render(root, snapshot, options = {}) {
  const focus = captureControlFocus(root);

  root.replaceChildren();

  const app = document.createElement('div');
  app.className = 'phc-directory';
  app.appendChild(createLifecycleView(snapshot, options));

  root.appendChild(app);
  restoreControlFocus(root, focus);
}
