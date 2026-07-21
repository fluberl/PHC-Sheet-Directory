/**
 * SearchResult — Version 1.0 (Milestone 8)
 * Immutable derived ordered set of directory records from a search.
 *
 * Does not assume a flat { id, title } shape — Catalog/Search accessors
 * interpret specialization records.
 */

/**
 * @typedef {{
 *   readonly size: number,
 *   getAll: () => readonly unknown[],
 * }} SearchResult
 */

/**
 * @param {readonly unknown[]} entries
 * @returns {SearchResult}
 */
export function createSearchResult(entries) {
  if (!Array.isArray(entries)) {
    throw new Error('SearchResult creation failed: expected an array of Domain Entries.');
  }

  /** @type {unknown[]} */
  const ordered = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];

    if (entry === null || typeof entry !== 'object') {
      throw new Error(
        `SearchResult creation failed at entry ${index + 1}: expected a Domain Entry.`,
      );
    }

    ordered.push(entry);
  }

  const frozenEntries = Object.freeze(ordered.slice());

  return Object.freeze({
    get size() {
      return frozenEntries.length;
    },

    getAll() {
      return frozenEntries;
    },
  });
}
