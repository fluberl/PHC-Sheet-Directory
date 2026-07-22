/**
 * Publication flag interpretation — Milestone 12
 * Column-name agnostic. German PUBLIC headings stay in the mapper.
 */

/**
 * @param {unknown} value
 * @returns {boolean | null}
 * `null` means the cell is empty / unspecified.
 */
export function interpretPublishedFlag(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }

  const text = String(value).trim().toLowerCase();
  if (text === '') {
    return null;
  }

  if (
    text === 'ja' ||
    text === 'yes' ||
    text === 'true' ||
    text === '1' ||
    text === 'x' ||
    text === 'published' ||
    text === 'y'
  ) {
    return true;
  }

  if (
    text === 'nein' ||
    text === 'no' ||
    text === 'false' ||
    text === '0' ||
    text === 'n' ||
    text === 'unpublished' ||
    text === 'draft'
  ) {
    return false;
  }

  return null;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPublishedFlagValue(value) {
  const interpreted = interpretPublishedFlag(value);
  if (interpreted === false) {
    return false;
  }
  return true;
}
