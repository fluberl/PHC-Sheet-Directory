/**
 * Generic record accessors — Version 1.0 (Milestone 8)
 * Catalog and Search read id/title through accessors so nested
 * specialization shapes (e.g. CPD) do not leak into generic modules.
 */

/**
 * @typedef {{
 *   getId: (entry: unknown) => string,
 *   getTitle: (entry: unknown) => string,
 * }} RecordAccessors
 */

/**
 * @param {{ getId: (entry: unknown) => string, getTitle: (entry: unknown) => string }} accessors
 * @returns {Readonly<RecordAccessors>}
 */
export function createRecordAccessors(accessors) {
  if (typeof accessors?.getId !== 'function' || typeof accessors?.getTitle !== 'function') {
    throw new Error('Record accessors require getId and getTitle functions.');
  }

  return Object.freeze({
    getId: accessors.getId,
    getTitle: accessors.getTitle,
  });
}

/**
 * Default accessors for flat { id, title } directory entries.
 * @type {Readonly<RecordAccessors>}
 */
export const flatRecordAccessors = createRecordAccessors({
  getId(entry) {
    if (entry === null || typeof entry !== 'object' || typeof entry.id !== 'string') {
      throw new Error('Flat record accessor expected entry.id string.');
    }
    return entry.id;
  },
  getTitle(entry) {
    if (entry === null || typeof entry !== 'object' || typeof entry.title !== 'string') {
      throw new Error('Flat record accessor expected entry.title string.');
    }
    return entry.title;
  },
});

/**
 * Build immutable { id, title } projections for rendering snapshots.
 *
 * @param {{ getAll: () => readonly unknown[] }} searchResult
 * @param {RecordAccessors} accessors
 * @returns {readonly { id: string, title: string }[]}
 */
export function projectIdTitleResults(searchResult, accessors) {
  return Object.freeze(
    searchResult.getAll().map((entry) =>
      Object.freeze({
        id: accessors.getId(entry),
        title: accessors.getTitle(entry),
      }),
    ),
  );
}
