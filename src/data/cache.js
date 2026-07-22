/**
 * Last-good PUBLIC payload cache — Milestone 12
 * Browser localStorage when available. No-op in Node tests without storage.
 */

const CACHE_PREFIX = 'phc-directory:public-cache:v1:';

/**
 * @returns {Storage | null}
 */
function getStorage() {
  try {
    if (typeof globalThis === 'undefined') {
      return null;
    }
    const storage = /** @type {{ localStorage?: Storage }} */ (globalThis)
      .localStorage;
    if (!storage || typeof storage.getItem !== 'function') {
      return null;
    }
    return storage;
  } catch {
    return null;
  }
}

/**
 * @param {string} source
 * @returns {string}
 */
function cacheKey(source) {
  return `${CACHE_PREFIX}${source}`;
}

/**
 * @param {string} source
 * @returns {unknown[] | null}
 */
export function readCachedPublicPayload(source) {
  const storage = getStorage();
  if (!storage || typeof source !== 'string' || source.trim() === '') {
    return null;
  }

  try {
    const raw = storage.getItem(cacheKey(source));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.payload)) {
      return null;
    }
    return parsed.payload;
  } catch {
    return null;
  }
}

/**
 * @param {string} source
 * @param {unknown[]} payload
 */
export function writeCachedPublicPayload(source, payload) {
  const storage = getStorage();
  if (!storage || typeof source !== 'string' || source.trim() === '') {
    return;
  }

  if (!Array.isArray(payload)) {
    return;
  }

  try {
    storage.setItem(
      cacheKey(source),
      JSON.stringify({
        savedAt: new Date().toISOString(),
        payload,
      }),
    );
  } catch {
    /* quota / private mode — ignore */
  }
}
