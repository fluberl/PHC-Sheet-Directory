/**
 * Generic record accessors — Version 1.0 (Milestone 14)
 * Catalog and Search read identity/title/search/category through accessors
 * so specialization shapes do not leak into generic modules.
 */

/**
 * @typedef {{
 *   getId: (entry: unknown) => string,
 *   getTitle: (entry: unknown) => string,
 *   getSearchableText?: (entry: unknown) => string,
 *   getPrimaryCategoryId?: (entry: unknown) => string | null,
 *   getCategoryIds?: (entry: unknown) => readonly string[],
 * }} RecordAccessors
 */

/**
 * @param {{
 *   getId: (entry: unknown) => string,
 *   getTitle: (entry: unknown) => string,
 *   getSearchableText?: (entry: unknown) => string,
 *   getPrimaryCategoryId?: (entry: unknown) => string | null,
 *   getCategoryIds?: (entry: unknown) => readonly string[],
 * }} accessors
 * @returns {Readonly<RecordAccessors>}
 */
export function createRecordAccessors(accessors) {
  if (typeof accessors?.getId !== 'function' || typeof accessors?.getTitle !== 'function') {
    throw new Error('Record accessors require getId and getTitle functions.');
  }

  /** @type {RecordAccessors} */
  const created = {
    getId: accessors.getId,
    getTitle: accessors.getTitle,
  };

  if (typeof accessors.getSearchableText === 'function') {
    created.getSearchableText = accessors.getSearchableText;
  }

  if (typeof accessors.getPrimaryCategoryId === 'function') {
    created.getPrimaryCategoryId = accessors.getPrimaryCategoryId;
  }

  if (typeof accessors.getCategoryIds === 'function') {
    created.getCategoryIds = accessors.getCategoryIds;
  }

  return Object.freeze(created);
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
