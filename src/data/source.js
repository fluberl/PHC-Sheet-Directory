/**
 * Data Source — Version 1.0 (Milestone 3)
 * Acquires the raw PUBLIC payload only.
 *
 * Failure kinds are acquisition/transport classifications only.
 * They are not Schema Validation outcomes.
 */

/**
 * @typedef {'not_configured' | 'network' | 'http' | 'invalid_json' | 'not_array'} PublicAcquisitionErrorKind
 *
 * @typedef {{
 *   ok: true,
 *   payload: unknown[],
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
 * @param {{ publicSource?: string }} config
 * @returns {Promise<PublicAcquisitionResult>}
 */
export async function fetchPublic(config) {
  const source = config.publicSource;

  if (typeof source !== 'string' || source.trim() === '') {
    return {
      ok: false,
      kind: 'not_configured',
      message: 'PUBLIC source is not configured.',
    };
  }

  let response;

  try {
    response = await fetch(source);
  } catch {
    return {
      ok: false,
      kind: 'network',
      message: 'PUBLIC acquisition failed: network error.',
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      kind: 'http',
      message: `PUBLIC acquisition failed: HTTP ${response.status}.`,
    };
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      kind: 'invalid_json',
      message: 'PUBLIC acquisition failed: response is not valid JSON.',
    };
  }

  if (!Array.isArray(payload)) {
    return {
      ok: false,
      kind: 'not_array',
      message:
        'PUBLIC acquisition failed: JSON value is not an array (not schema validation).',
    };
  }

  return {
    ok: true,
    payload,
  };
}
