/**
 * Minimal CSV parser for PUBLIC sheet exports — Milestone 12
 * Produces an array of plain objects keyed by the header row.
 * Supports Google Sheets section-banner rows above the real header.
 */

/**
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsvRecords(text) {
  const source = String(text ?? '').replace(/^\uFEFF/, '');
  /** @type {string[][]} */
  const rows = [];
  /** @type {string[]} */
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    field += char;
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((record) => record.some((cell) => String(cell).trim() !== ''));
}

/**
 * Prefer the densest early row as the header (skips sparse section banners).
 *
 * @param {string[][]} records
 * @returns {number}
 */
function findHeaderRowIndex(records) {
  let bestIndex = 0;
  let bestScore = -1;

  const limit = Math.min(records.length, 5);
  for (let i = 0; i < limit; i += 1) {
    const score = records[i].filter((cell) => String(cell).trim() !== '').length;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * @param {string} text
 * @returns {Record<string, string>[]}
 */
export function parseCsvObjects(text) {
  const records = parseCsvRecords(text);
  if (records.length === 0) {
    return [];
  }

  const headerIndex = findHeaderRowIndex(records);
  const headers = records[headerIndex].map((header) => String(header).trim());
  /** @type {Record<string, string>[]} */
  const objects = [];

  for (let i = headerIndex + 1; i < records.length; i += 1) {
    const cells = records[i];
    /** @type {Record<string, string>} */
    const object = Object.create(null);
    let hasValue = false;

    headers.forEach((header, index) => {
      if (!header) {
        return;
      }
      const value = cells[index] == null ? '' : String(cells[index]).trim();
      object[header] = value;
      if (value !== '') {
        hasValue = true;
      }
    });

    if (hasValue) {
      objects.push(object);
    }
  }

  return objects;
}
