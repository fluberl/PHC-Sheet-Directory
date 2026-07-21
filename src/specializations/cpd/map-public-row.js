/**
 * PUBLIC row → CPD domain mapper — Milestone 8
 *
 * Sole module that knows frozen German PUBLIC column headings.
 * Generic Catalog, Search, and Rendering must not import this file's
 * heading constants for business logic (fixtures/tests/docs may cite them).
 */

import { createCpdCourse } from './course.js';

/** Frozen PUBLIC v1.0 column headings (logical order). */
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
  formats: 'Durchführungsformat',
  scheduleType: 'Terminart',
  nextStart: 'Nächster Start',
  scheduleDescription: 'Durchführung / Zeitplan',
  courseUrl: 'Kursseite / Anmeldung',
});

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

  return createCpdCourse({
    providerType: readColumn(record, PUBLIC_COLUMNS.providerType),
    providerName: readColumn(record, PUBLIC_COLUMNS.providerName),
    providerWebsiteUrl: readColumn(record, PUBLIC_COLUMNS.providerWebsiteUrl),
    providerLogoUrl: readColumn(record, PUBLIC_COLUMNS.providerLogoUrl),
    courseId: readColumn(record, PUBLIC_COLUMNS.courseId),
    title: readColumn(record, PUBLIC_COLUMNS.title),
    shortTitle: readColumn(record, PUBLIC_COLUMNS.shortTitle),
    summary: readColumn(record, PUBLIC_COLUMNS.summary),
    description: readColumn(record, PUBLIC_COLUMNS.description),
    location: readColumn(record, PUBLIC_COLUMNS.location),
    cpdHours: readColumn(record, PUBLIC_COLUMNS.cpdHours),
    imageUrl: readColumn(record, PUBLIC_COLUMNS.imageUrl),
    qrCodeUrl: readColumn(record, PUBLIC_COLUMNS.qrCodeUrl),
    primaryCategory: readColumn(record, PUBLIC_COLUMNS.primaryCategory),
    additionalCategories: readColumn(
      record,
      PUBLIC_COLUMNS.additionalCategories,
    ),
    formats: readColumn(record, PUBLIC_COLUMNS.formats),
    scheduleType: readColumn(record, PUBLIC_COLUMNS.scheduleType),
    nextStart: readColumn(record, PUBLIC_COLUMNS.nextStart),
    scheduleDescription: readColumn(
      record,
      PUBLIC_COLUMNS.scheduleDescription,
    ),
    courseUrl: readColumn(record, PUBLIC_COLUMNS.courseUrl),
  });
}

/**
 * Map all PUBLIC rows; preserves source order.
 *
 * @param {unknown[]} rows
 * @returns {Readonly<import('./course.js').CpdCourse>[]}
 */
export function mapPublicRowsToCpdCourses(rows) {
  if (!Array.isArray(rows)) {
    throw new Error('PUBLIC mapper expected an array of rows.');
  }

  return rows.map((row, index) => {
    try {
      return mapPublicRowToCpdCourse(row);
    } catch (failure) {
      const detail =
        failure instanceof Error && failure.message
          ? failure.message
          : 'mapping failed';
      throw new Error(`PUBLIC mapping failed at row ${index + 1}: ${detail}`);
    }
  });
}
