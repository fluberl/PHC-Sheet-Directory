/**
 * Data Source — Version 1.0 (Milestone 12)
 * Acquires the raw PUBLIC payload only (JSON array or CSV / Google Sheets export).
 *
 * Failure kinds are acquisition/transport classifications only.
 * They are not Schema Validation outcomes.
 */

import { readCachedPublicPayload, writeCachedPublicPayload } from './cache.js';
import { resolvePublicAcquisitionUrl } from './google-sheets.js';
import { parseCsvObjects } from './parse-csv.js';

/**
 * @typedef {'not_configured' | 'network' | 'http' | 'invalid_payload' | 'not_array'} PublicAcquisitionErrorKind
 *
 * @typedef {{
 *   ok: true,
 *   payload: unknown[],
 *   fromCache?: boolean,
 * }} PublicAcquisitionSuccess
 *
 * @typedef {{
 *   ok: false,
 *   kind: PublicAcquisitionErrorKind,
 *   message: string,
 * }} PublicAcquisitionFailure
 *
 * @typedef {PublicAcquisitionSuccess | PublicAcquisitionFailure} PublicAcquisitionResult
 */

/**
 * @param {string} text
 * @returns {unknown}
 */
function parseJsonValue(text) {
  return JSON.parse(text);
}

/**
 * @param {string} text
 * @param {string} sourceUrl
 * @param {Headers | undefined} headers
 * @returns {unknown[]}
 */
function decodePayload(text, sourceUrl, headers) {
  const trimmed = String(text ?? '').trim();
  if (trimmed === '') {
    return [];
  }

  const contentType = headers?.get?.('content-type')?.toLowerCase() ?? '';
  const looksJson =
    trimmed.startsWith('[') ||
    trimmed.startsWith('{') ||
    contentType.includes('application/json') ||
    /\.json(\?|#|$)/i.test(sourceUrl);

  if (looksJson) {
    const parsed = parseJsonValue(trimmed);
    if (!Array.isArray(parsed)) {
      throw Object.assign(new Error('not_array'), { kind: 'not_array' });
    }
    return parsed;
  }

  const looksCsv =
    contentType.includes('text/csv') ||
    contentType.includes('application/vnd.ms-excel') ||
    /export\?format=csv/i.test(sourceUrl) ||
    /[,\n]/.test(trimmed);

  if (looksCsv) {
    return parseCsvObjects(trimmed);
  }

  // Last resort: try JSON, then CSV.
  try {
    const parsed = parseJsonValue(trimmed);
    if (!Array.isArray(parsed)) {
      throw Object.assign(new Error('not_array'), { kind: 'not_array' });
    }
    return parsed;
  } catch (failure) {
    if (failure && typeof failure === 'object' && 'kind' in failure) {
      throw failure;
    }
    return parseCsvObjects(trimmed);
  }
}

/**
 * @param {string} resolvedSource
 * @param {PublicAcquisitionFailure} failure
 * @returns {PublicAcquisitionResult}
 */
function withCacheFallback(resolvedSource, failure) {
  const cached = readCachedPublicPayload(resolvedSource);
  if (cached) {
    return {
      ok: true,
      payload: cached,
      fromCache: true,
    };
  }
  return failure;
}

/**
 * @param {{ publicSource?: string }} config
 * @returns {Promise<PublicAcquisitionResult>}
 */
export async function fetchPublic(config) {
  const configured = config.publicSource;

  if (typeof configured !== 'string' || configured.trim() === '') {
    return {
      ok: false,
      kind: 'not_configured',
      message: 'PUBLIC source is not configured.',
    };
  }

  const source = resolvePublicAcquisitionUrl(configured.trim());

  let response;

  try {
    response = await fetch(source);
  } catch {
    return withCacheFallback(source, {
      ok: false,
      kind: 'network',
      message:
        'The CPD directory could not be loaded right now. Please try again later.',
    });
  }

  if (!response.ok) {
    return withCacheFallback(source, {
      ok: false,
      kind: 'http',
      message:
        'The CPD directory could not be loaded right now. Please try again later.',
    });
  }

  let text;

  try {
    text = await response.text();
  } catch {
    return withCacheFallback(source, {
      ok: false,
      kind: 'invalid_payload',
      message:
        'The CPD directory could not be loaded right now. Please try again later.',
    });
  }

  let payload;

  try {
    payload = decodePayload(text, source, response.headers);
  } catch (failure) {
    if (
      failure &&
      typeof failure === 'object' &&
      /** @type {{ kind?: string }} */ (failure).kind === 'not_array'
    ) {
      return withCacheFallback(source, {
        ok: false,
        kind: 'not_array',
        message:
          'The CPD directory could not be loaded right now. Please try again later.',
      });
    }

    return withCacheFallback(source, {
      ok: false,
      kind: 'invalid_payload',
      message:
        'The CPD directory could not be loaded right now. Please try again later.',
    });
  }

  if (!Array.isArray(payload)) {
    return withCacheFallback(source, {
      ok: false,
      kind: 'not_array',
      message:
        'The CPD directory could not be loaded right now. Please try again later.',
    });
  }

  writeCachedPublicPayload(source, payload);

  return {
    ok: true,
    payload,
  };
}
