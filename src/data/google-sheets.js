/**
 * Google Sheets PUBLIC URL helpers — Milestone 12
 * Datasource-only. No presentation or CPD imports.
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isGoogleSheetsUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      url.hostname === 'docs.google.com' &&
      url.pathname.includes('/spreadsheets/')
    );
  } catch {
    return false;
  }
}

/**
 * Keep published CSV and export CSV URLs as-is.
 * Do not rewrite /d/e/…/pub links (published web CSV).
 *
 * @param {string} source
 * @returns {string}
 */
export function resolvePublicAcquisitionUrl(source) {
  const text = String(source || '').trim();
  if (text === '') {
    return text;
  }

  if (!isGoogleSheetsUrl(text)) {
    return text;
  }

  try {
    const url = new URL(text);
    const output = url.searchParams.get('output');
    const format = url.searchParams.get('format');

    if (url.pathname.includes('/pub') && (output === 'csv' || format === 'csv')) {
      return text;
    }

    if (url.pathname.includes('/export') && format === 'csv') {
      return text;
    }

    return text;
  } catch {
    return text;
  }
}
