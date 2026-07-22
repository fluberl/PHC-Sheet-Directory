/**
 * CPD results view selection — Milestone 11
 * Chooses presentation for an already-filtered display-model collection.
 */

import { createCpdCourseCardList } from './render-cards.js';
import { createCpdChronologicalList } from './render-list.js';
import { sortCardsByNextStart } from './sort.js';
import { normalizeViewMode } from './view-modes.js';

/**
 * @typedef {import('./presentation.js').CpdCourseCardModel} CpdCourseCardModel
 * @typedef {import('./view-modes.js').CpdViewMode} CpdViewMode
 */

/**
 * @param {readonly Readonly<CpdCourseCardModel>[]} cards
 * @param {unknown} viewMode
 * @returns {HTMLElement}
 */
export function createCpdResultsView(cards, viewMode) {
  const mode = normalizeViewMode(viewMode);
  const source = Array.isArray(cards) ? cards : [];

  if (mode === 'chronological') {
    return createCpdChronologicalList(sortCardsByNextStart(source));
  }

  if (mode === 'calendar') {
    return createCpdCourseCardList(sortCardsByNextStart(source));
  }

  return createCpdCourseCardList(source);
}
