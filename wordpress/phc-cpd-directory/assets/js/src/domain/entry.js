/**
 * Domain Model — Version 1.0 (Milestone 5)
 * Generic immutable directory entry for the Directory Engine.
 *
 * No CPD terminology, rendering metadata, or raw-row references.
 */

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 * }} DirectoryEntry
 */

/**
 * Create one immutable directory entry from validated values only.
 *
 * @param {{ id: string, title: string }} values
 * @returns {Readonly<DirectoryEntry>}
 */
export function createDirectoryEntry(values) {
  if (typeof values?.id !== 'string' || typeof values?.title !== 'string') {
    throw new Error('DirectoryEntry requires string id and title.');
  }

  return Object.freeze({
    id: values.id,
    title: values.title,
  });
}
