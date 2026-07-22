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
 * Invalid values become null so incomplete PUBLIC rows do not crash the load.
 *
 * @param {unknown} value
 * @returns {number | null}
 */
export function normalizeCpdHours(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const text = normalizeText(value);
  if (text === '') {
    return null;
  }

  const normalized = text.replace(',', '.');
  if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Coerce a next-start cell to ISO YYYY-MM-DD when possible.
 * Supports ISO dates and DD.MM.YYYY (including slash-separated lists).
 * Returns the earliest valid date for multi-value cells.
 *
 * @param {unknown} value
 * @returns {string | null}
 */
export function coerceNextStartIso(value) {
  const text = normalizeText(value);
  if (text === '') {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parts = text.split(/[/|;]/).map((part) => part.trim()).filter(Boolean);
  /** @type {string[]} */
  const dates = [];

  for (const part of parts) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
      dates.push(part);
      continue;
    }
    const match = part.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      dates.push(`${match[3]}-${month}-${day}`);
    }
  }

  if (dates.length === 0) {
    return null;
  }

  dates.sort();
  return dates[0];
}

/** @type {Intl.DateTimeFormat} */
const SWISS_DATE_LONG = new Intl.DateTimeFormat('de-CH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** @type {Intl.DateTimeFormat} */
const SWISS_DATE_SHORT = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * @param {string} iso
 * @returns {Date | null}
 */
function dateFromIsoDay(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return null;
  }
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Format a next-start value for display with Swiss long form (e.g. 17. August 2026).
 * Falls back to the original text when the value cannot be coerced to a date.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function formatSwissDateLong(value) {
  const iso = coerceNextStartIso(value);
  if (!iso) {
    return normalizeText(value);
  }
  const date = dateFromIsoDay(iso);
  if (!date) {
    return normalizeText(value);
  }
  return SWISS_DATE_LONG.format(date);
}

/**
 * Format a next-start value for compact Swiss display (e.g. 17.08.2026).
 * Falls back to the original text when the value cannot be coerced to a date.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function formatSwissDateShort(value) {
  const iso = coerceNextStartIso(value);
  if (!iso) {
    return normalizeText(value);
  }
  const date = dateFromIsoDay(iso);
  if (!date) {
    return normalizeText(value);
  }
  return SWISS_DATE_SHORT.format(date);
}

/**
 * Normalize website / media URLs from PUBLIC cells.
 * Adds https:// when a bare domain is provided.
 * Rewrites Google Drive links to a direct image CDN URL suitable for <img src>.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizePublicUrl(value) {
  const text = normalizeText(value);
  if (text === '') {
    return '';
  }

  const driveId = extractGoogleDriveFileId(text);
  if (driveId) {
    // Direct image URL used by Drive thumbnails; works for publicly shared files.
    return `https://lh3.googleusercontent.com/d/${driveId}=w1000`;
  }

  if (/^https?:\/\//i.test(text) || text.startsWith('/')) {
    return text;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(text)) {
    return `https://${text}`;
  }

  return text;
}

/**
 * @param {string} text
 * @returns {string | null}
 */
function extractGoogleDriveFileId(text) {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
    /drive\.google\.com\/open\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
    /drive\.google\.com\/uc\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
    /drive\.google\.com\/thumbnail\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
    /drive\.usercontent\.google\.com\/(?:download|uc)\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
