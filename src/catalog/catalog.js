/**
 * Catalog — Version 1.0 (Milestone 6)
 * Immutable collection of Domain Entries.
 *
 * Answers only: size, all entries in source order, lookup by id.
 * No search, filter, sort, group, pagination, or rendering.
 */

/**
 * @typedef {{ id: string, title: string }} DirectoryEntry
 *
 * @typedef {{
 *   readonly size: number,
 *   getAll: () => readonly DirectoryEntry[],
 *   getById: (id: string) => DirectoryEntry | null,
 * }} Catalog
 */

/**
 * Create an immutable Catalog from transformed Domain Entries.
 *
 * @param {readonly DirectoryEntry[]} entries
 * @returns {Catalog}
 */
export function createCatalog(entries) {
  if (!Array.isArray(entries)) {
    throw new Error('Catalog creation failed: expected an array of Domain Entries.');
  }

  /** @type {DirectoryEntry[]} */
  const ordered = [];
  /** @type {Map<string, DirectoryEntry>} */
  const byId = new Map();

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];

    if (
      entry === null ||
      typeof entry !== 'object' ||
      typeof entry.id !== 'string' ||
      typeof entry.title !== 'string'
    ) {
      throw new Error(
        `Catalog creation failed at entry ${index + 1}: expected a Domain Entry.`,
      );
    }

    if (byId.has(entry.id)) {
      throw new Error(
        `Catalog creation failed: unexpected duplicate id "${entry.id}".`,
      );
    }

    ordered.push(entry);
    byId.set(entry.id, entry);
  }

  const frozenEntries = Object.freeze(ordered.slice());

  return Object.freeze({
    get size() {
      return frozenEntries.length;
    },

    getAll() {
      return frozenEntries;
    },

    /**
     * @param {string} id
     * @returns {DirectoryEntry | null}
     */
    getById(id) {
      if (typeof id !== 'string') {
        return null;
      }

      return byId.get(id) ?? null;
    },
  });
}
