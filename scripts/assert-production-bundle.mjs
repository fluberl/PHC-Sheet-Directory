/**
 * Shared checks for the WordPress production IIFE bundle.
 */

/**
 * @param {string} source
 * @returns {string}
 */
export function stripJsComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/**
 * @param {string} bundle
 * @param {(condition: boolean, message: string) => void} assert
 */
export function assertProductionBundle(bundle, assert) {
  const code = stripJsComments(bundle);

  assert(!/\bimport\s+/.test(code), 'bundle must not contain static import');
  assert(!/\bimport\s*\(/.test(code), 'bundle must not contain dynamic import');
  assert(
    bundle.includes('Ort') &&
      bundle.includes('Kategorie') &&
      bundle.includes('Nächster Termin'),
    'bundle must include German M14 card labels',
  );
  assert(
    bundle.includes('de-CH') && bundle.includes('Intl.DateTimeFormat'),
    'bundle must include Swiss date formatting',
  );
  assert(
    !bundle.includes("createMetaItem('Location'"),
    'bundle must not contain pre-M14 Location label',
  );
  assert(
    !bundle.includes("createMetaItem('Category'"),
    'bundle must not contain pre-M14 Category label',
  );
  assert(
    bundle.includes('Nach Datum'),
    'bundle must include Nach Datum view label',
  );
  assert(
    !bundle.includes('Kalenderkarten'),
    'bundle must not contain obsolete Kalenderkarten label',
  );
}
