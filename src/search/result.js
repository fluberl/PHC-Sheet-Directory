/**
 * SearchResult — Version 1.0 (Milestone 7)
 * Immutable derived ordered set of Directory Entries from a search.
 *
 * Catalog remains the full durable dataset.
 * SearchResult is the current match set only.
 *
 * Interface is intentionally minimal: size + getAll().
 * ID lookup stays on Catalog until a concrete runtime need appears.
 */

/**
 * @typedef {{ id: string, title: string }} DirectoryEntry
 *
 * @typedef {{
 *   readonly size: number,
 *   getAll: () => readonly DirectoryEntry[],
 * }} SearchResult
 */

/**
 * Create an immutable SearchResult from matching Domain Entries.
 * Preserves the order of the provided entries (Catalog source order).
 *
 * @param {readonly DirectoryEntry[]} entries
 * @returns {SearchResult}
 */
export function createSearchResult(entries) {
  if (!Array.isArray(entries)) {
    throw new Error('SearchResult creation failed: expected an array of Domain Entries.');
  }

  /** @type {DirectoryEntry[]} */
  const ordered = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];

    if (
      entry === null ||
      typeof entry !== 'object' ||
      typeof entry.id !== 'string' ||
      typeof entry.title !== 'string'
    ) {
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
