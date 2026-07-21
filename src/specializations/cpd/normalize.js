/**
 * CPD normalization helpers — PHC CPD specialization (Milestone 8)
 */

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

/**
 * Parse comma-separated string or array into a frozen string list.
 * Preserves order; does not sort; drops empty items.
 *
 * @param {unknown} value
 * @returns {readonly string[]}
 */
export function parseStringList(value) {
  /** @type {string[]} */
  let items = [];

  if (value === null || value === undefined || value === '') {
    items = [];
  } else if (Array.isArray(value)) {
    items = value.map((item) => normalizeText(item));
  } else {
    items = String(value)
      .split(',')
      .map((item) => normalizeText(item));
  }

  return Object.freeze(items.filter((item) => item !== ''));
}

/**
 * Normalize CPD hours to a finite number or null.
 * Accepts numbers and strings with '.' or ',' decimals.
 *
 * @param {unknown} value
 * @returns {number | null}
 */
export function normalizeCpdHours(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('CPD hours must be a finite number.');
    }
    return value;
  }

  const text = normalizeText(value);
  if (text === '') {
    return null;
  }

  const normalized = text.replace(',', '.');
  if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`CPD hours value is not numeric: "${text}".`);
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`CPD hours value is not numeric: "${text}".`);
  }

  return parsed;
}
