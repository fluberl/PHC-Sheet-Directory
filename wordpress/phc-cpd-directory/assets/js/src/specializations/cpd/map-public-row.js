/**
 * PUBLIC row → CPD domain mapper — Milestone 12
 *
 * Sole module that knows frozen German PUBLIC column headings.
 * Generic Catalog, Search, and Rendering must not import this file's
 * heading constants for business logic (fixtures/tests/docs may cite them).
 *
 * Incomplete or unpublished rows are skipped so one bad row cannot fail the directory.
 */

import { createCpdCourse } from './course.js';
import {
  coerceNextStartIso,
  normalizePublicUrl,
  normalizeText,
} from './normalize.js';
import { interpretPublishedFlag } from './published.js';

/** Frozen PUBLIC v1.0 (+ M12) column headings (logical order). */
export const PUBLIC_COLUMNS = Object.freeze({
  providerType: 'Anbietertyp',
  providerName: 'Name des Anbieters',
  providerWebsiteUrl: 'Website des Anbieters',
  providerLogoUrl: 'Logo des Anbieters',
  courseId: 'PHC-CPD-ID',
  title: 'Vollständiger Titel',
  shortTitle: 'Kurztitel',
  summary: 'Kurzbeschreibung',
  description: 'Ausführliche Beschreibung',
  location: 'Veranstaltungsort',
  cpdHours: 'Anrechenbare Weiterbildungsstunden (CPD)',
  imageUrl: 'Bild der Weiterbildung',
  qrCodeUrl: 'QR-Code (optional)',
  primaryCategory: 'Primärkategorie',
  additionalCategories: 'Weitere Kategorien',
  languages: 'Unterrichtssprache',
  formats: 'Durchführungsformat',
  scheduleType: 'Terminart',
  nextStart: 'Nächster Start',
  scheduleDescription: 'Durchführung / Zeitplan',
  courseUrl: 'Kursseite / Anmeldung',
  published: 'Veröffentlicht',
});

/** English / alternate publication column names accepted on PUBLIC rows. */
const PUBLISHED_COLUMN_ALIASES = Object.freeze([
  PUBLIC_COLUMNS.published,
  'Published',
  'Freigegeben',
]);

/**
 * @param {Record<string, unknown>} row
 * @param {string} column
 * @returns {unknown}
 */
function readColumn(row, column) {
  if (Object.prototype.hasOwnProperty.call(row, column)) {
    return row[column];
  }
  return undefined;
}

/**
 * Rows without a publication column (or with an empty flag) are treated as
 * published so older PUBLIC fixtures remain valid. Explicit negatives are hidden.
 *
 * @param {unknown} row
 * @returns {boolean}
 */
export function isPublishedPublicRow(row) {
  if (row === null || typeof row !== 'object' || Array.isArray(row)) {
    return false;
  }

  const record = /** @type {Record<string, unknown>} */ (row);

  for (const column of PUBLISHED_COLUMN_ALIASES) {
    if (!Object.prototype.hasOwnProperty.call(record, column)) {
      continue;
    }
    const interpreted = interpretPublishedFlag(record[column]);
    if (interpreted === false) {
      return false;
    }
    if (interpreted === true) {
      return true;
    }
  }

  return true;
}

/**
 * Map one canonical PUBLIC row to an immutable CPD course entity.
 *
 * @param {unknown} row
 * @returns {Readonly<import('./course.js').CpdCourse>}
 */
export function mapPublicRowToCpdCourse(row) {
  if (row === null || typeof row !== 'object' || Array.isArray(row)) {
    throw new Error('PUBLIC mapper expected a plain object row.');
  }

  const record = /** @type {Record<string, unknown>} */ (row);
  const rawNextStart = readColumn(record, PUBLIC_COLUMNS.nextStart);
  const nextStartIso = coerceNextStartIso(rawNextStart);
  const nextStart =
    nextStartIso ||
    (typeof rawNextStart === 'string' || typeof rawNextStart === 'number'
      ? normalizeText(rawNextStart)
      : '');

  return createCpdCourse({
    providerType: readColumn(record, PUBLIC_COLUMNS.providerType),
    providerName: readColumn(record, PUBLIC_COLUMNS.providerName),
    providerWebsiteUrl: normalizePublicUrl(
      readColumn(record, PUBLIC_COLUMNS.providerWebsiteUrl),
    ),
    providerLogoUrl: normalizePublicUrl(
      readColumn(record, PUBLIC_COLUMNS.providerLogoUrl),
    ),
    courseId: readColumn(record, PUBLIC_COLUMNS.courseId),
    title: readColumn(record, PUBLIC_COLUMNS.title),
    shortTitle: readColumn(record, PUBLIC_COLUMNS.shortTitle),
    summary: readColumn(record, PUBLIC_COLUMNS.summary),
    description: readColumn(record, PUBLIC_COLUMNS.description),
    location: readColumn(record, PUBLIC_COLUMNS.location),
    cpdHours: readColumn(record, PUBLIC_COLUMNS.cpdHours),
    imageUrl: normalizePublicUrl(readColumn(record, PUBLIC_COLUMNS.imageUrl)),
    qrCodeUrl: normalizePublicUrl(readColumn(record, PUBLIC_COLUMNS.qrCodeUrl)),
    primaryCategory: readColumn(record, PUBLIC_COLUMNS.primaryCategory),
    additionalCategories: readColumn(
      record,
      PUBLIC_COLUMNS.additionalCategories,
    ),
    languages: readColumn(record, PUBLIC_COLUMNS.languages),
    formats: readColumn(record, PUBLIC_COLUMNS.formats),
    scheduleType: readColumn(record, PUBLIC_COLUMNS.scheduleType),
    nextStart,
    scheduleDescription: readColumn(
      record,
      PUBLIC_COLUMNS.scheduleDescription,
    ),
    courseUrl: normalizePublicUrl(readColumn(record, PUBLIC_COLUMNS.courseUrl)),
  });
}

/**
 * Map published PUBLIC rows; preserves source order.
 * Skips unpublished and incomplete rows instead of failing the load.
 *
 * @param {unknown[]} rows
 * @returns {Readonly<import('./course.js').CpdCourse>[]}
 */
export function mapPublicRowsToCpdCourses(rows) {
  if (!Array.isArray(rows)) {
    throw new Error('PUBLIC mapper expected an array of rows.');
  }

  /** @type {Readonly<import('./course.js').CpdCourse>[]} */
  const courses = [];

  rows.forEach((row) => {
    if (!isPublishedPublicRow(row)) {
      return;
    }

    try {
      courses.push(mapPublicRowToCpdCourse(row));
    } catch {
      /* incomplete optional/required mix — skip row */
    }
  });

  return courses;
}
