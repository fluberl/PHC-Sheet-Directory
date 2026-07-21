/**
 * Configuration — Version 1.0 (Milestone 3)
 * Declares host-agnostic instance defaults.
 * Hosts (demo, WordPress, tests) supply runtime values such as publicSource.
 */

/**
 * @returns {{ mountSelector: string }}
 */
export function getConfig() {
  return Object.freeze({
    mountSelector: '#phc-cpd-directory',
  });
}
