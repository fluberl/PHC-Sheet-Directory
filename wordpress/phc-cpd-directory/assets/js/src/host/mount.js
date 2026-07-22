/**
 * Host Contract — Version 1.0 (Milestone 1)
 * Locates the mount root. Never modifies the DOM.
 */

/**
 * @param {string} selector
 * @returns {{ ok: true, root: Element } | { ok: false, message: string }}
 */
export function getMountRoot(selector) {
  if (typeof selector !== 'string' || selector.trim() === '') {
    return {
      ok: false,
      message: 'Host Contract: mount selector is missing or invalid.',
    };
  }

  const root = document.querySelector(selector);

  if (!root) {
    return {
      ok: false,
      message: `Host Contract: mount root not found for selector "${selector}". The directory application will not start.`,
    };
  }

  return { ok: true, root };
}
