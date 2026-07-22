/**
 * Configuration — Version 1.0 (Milestone 12)
 * Declares host-agnostic instance defaults.
 * Hosts may override runtime values such as publicSource.
 */

import { getPhcPublicCpdSource } from './phc-public-cpd.js';

/**
 * @returns {{ mountSelector: string, publicSource: string }}
 */
export function getConfig() {
  return Object.freeze({
    mountSelector: '#phc-cpd-directory',
    publicSource: getPhcPublicCpdSource(),
  });
}
