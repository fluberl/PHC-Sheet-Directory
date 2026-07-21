/**
 * Transformation — Version 1.0 (Milestone 5)
 * Converts validated PUBLIC rows into generic Domain Entries.
 *
 * Assumes structural validation has already succeeded.
 * Does not acquire, validate, mutate state, or render.
 * Does not repair or coerce invalid input.
 */

import { createDirectoryEntry } from './entry.js';

/**
 * @typedef {import('./entry.js').DirectoryEntry} DirectoryEntry
 */

/**
 * @param {unknown[]} rows
 * @returns {Readonly<DirectoryEntry>[]}
 */
export function transformRowsToEntries(rows) {
  if (!Array.isArray(rows)) {
    throw new Error('Transformation failed: expected an array of validated rows.');
  }

  return rows.map((row, index) => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(
        `Transformation failed at row ${index + 1}: expected a validated object.`,
      );
    }

    const record = /** @type {Record<string, unknown>} */ (row);

    if (typeof record.id !== 'string' || typeof record.title !== 'string') {
      throw new Error(
        `Transformation failed at row ${index + 1}: expected validated string id and title.`,
      );
    }

    return createDirectoryEntry({
      id: record.id,
      title: record.title,
    });
  });
}
