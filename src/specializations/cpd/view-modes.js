/**
 * CPD display modes — Milestone 11
 * Presentation-only identifiers. No taxonomy or datasource knowledge.
 */

/**
 * @typedef {'calendar' | 'catalogue' | 'chronological'} CpdViewMode
 *
 * @typedef {{
 *   id: CpdViewMode,
 *   label: string,
 * }} CpdViewModeOption
 */

/** @type {Readonly<CpdViewMode>} */
export const DEFAULT_CPD_VIEW_MODE = 'calendar';

/** @type {readonly Readonly<CpdViewModeOption>[]} */
export const CPD_VIEW_MODE_OPTIONS = Object.freeze([
  Object.freeze({ id: 'calendar', label: 'Calendar Cards' }),
  Object.freeze({ id: 'catalogue', label: 'Catalogue' }),
  Object.freeze({ id: 'chronological', label: 'Chronological List' }),
]);

/**
 * @param {unknown} value
 * @returns {CpdViewMode}
 */
export function normalizeViewMode(value) {
  if (value === 'catalogue' || value === 'chronological' || value === 'calendar') {
    return value;
  }

  return DEFAULT_CPD_VIEW_MODE;
}
