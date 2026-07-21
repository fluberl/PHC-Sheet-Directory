/**
 * Configuration — Version 1.0 (Milestone 1)
 * Declares this directory instance. No data or domain knowledge.
 */

/**
 * @returns {{ mountSelector: string }}
 */
export function getConfig() {
  return Object.freeze({
    mountSelector: '#phc-cpd-directory',
  });
}
