/**
 * CPD presentation sorting — Milestone 11
 * Sorts display models only. Does not touch Catalog or Search results.
 */

/**
 * @typedef {import('./presentation.js').CpdCourseCardModel} CpdCourseCardModel
 */

/**
 * @param {Readonly<CpdCourseCardModel>} card
 * @returns {string}
 */
function nextStartKey(card) {
  const value = card.delivery?.nextStart;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return '9999-12-31';
}

/**
 * Earliest upcoming next-start first. Missing/invalid dates sort last.
 * Stable for equal dates (preserves relative input order).
 *
 * @param {readonly Readonly<CpdCourseCardModel>[]} cards
 * @returns {readonly Readonly<CpdCourseCardModel>[]}
 */
export function sortCardsByNextStart(cards) {
  if (!Array.isArray(cards)) {
    return Object.freeze([]);
  }

  const indexed = cards.map((card, index) => ({ card, index }));
  indexed.sort((left, right) => {
    const byDate = nextStartKey(left.card).localeCompare(nextStartKey(right.card));
    if (byDate !== 0) {
      return byDate;
    }
    return left.index - right.index;
  });

  return Object.freeze(indexed.map((item) => item.card));
}
