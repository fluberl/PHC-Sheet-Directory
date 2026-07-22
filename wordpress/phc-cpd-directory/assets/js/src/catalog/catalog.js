/**
 * Catalog — Version 1.0 (Milestone 8)
 * Immutable collection of directory records.
 *
 * Answers only: size, all entries in source order, lookup by id.
 * Uses RecordAccessors so nested specialization shapes stay outside Catalog.
 */

import { flatRecordAccessors } from '../domain/accessors.js';

/**
 * @typedef {import('../domain/accessors.js').RecordAccessors} RecordAccessors
 *
 * @typedef {{
 *   readonly size: number,
 *   getAll: () => readonly unknown[],
 *   getById: (id: string) => unknown | null,
 * }} Catalog
 */

/**
 * Create an immutable Catalog from directory records.
 *
 * @param {readonly unknown[]} entries
 * @param {RecordAccessors} [accessors]
 * @returns {Catalog}
 */
export function createCatalog(entries, accessors = flatRecordAccessors) {
  if (!Array.isArray(entries)) {
    throw new Error('Catalog creation failed: expected an array of Domain Entries.');
  }

  if (
    accessors === null ||
    typeof accessors !== 'object' ||
    typeof accessors.getId !== 'function' ||
    typeof accessors.getTitle !== 'function'
  ) {
    throw new Error('Catalog creation failed: expected record accessors.');
  }

  /** @type {unknown[]} */
  const ordered = [];
  /** @type {Map<string, unknown>} */
  const byId = new Map();

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];

    if (entry === null || typeof entry !== 'object') {
      throw new Error(
        `Catalog creation failed at entry ${index + 1}: expected a Domain Entry.`,
      );
    }

    let id;
    let title;

    try {
      id = accessors.getId(entry);
      title = accessors.getTitle(entry);
    } catch (failure) {
      const detail =
        failure instanceof Error && failure.message
          ? failure.message
          : 'invalid record accessors';
      throw new Error(
        `Catalog creation failed at entry ${index + 1}: ${detail}`,
      );
    }

    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error(
        `Catalog creation failed at entry ${index + 1}: expected a non-empty id.`,
      );
    }

    if (typeof title !== 'string') {
      throw new Error(
        `Catalog creation failed at entry ${index + 1}: expected a title string.`,
      );
    }

    if (byId.has(id)) {
      throw new Error(
        `Catalog creation failed: unexpected duplicate id "${id}".`,
      );
    }

    ordered.push(entry);
    byId.set(id, entry);
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
     * @returns {unknown | null}
     */
    getById(id) {
      if (typeof id !== 'string') {
        return null;
      }

      return byId.get(id) ?? null;
    },
  });
}
