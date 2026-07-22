/**
 * CPD directory UI copy — Milestone 14
 * Specialization-owned German (de-CH) strings for the generic lifecycle shell
 * and CPD presentation chrome.
 */

export const cpdDirectoryCopy = Object.freeze({
  loading: 'Weiterbildungen werden geladen…',
  empty: 'Zurzeit sind keine Weiterbildungen verfügbar.',
  searchLabel: 'Weiterbildungen suchen',
  categoryLabel: 'Kategorie',
  allCategoriesLabel: 'Alle Kategorien',
  viewLabel: 'Ansicht',
  resultStatusNone: 'Keine passenden Weiterbildungen',
  resultStatusOne: '1 Weiterbildung',
  /**
   * @param {number} count
   * @returns {string}
   */
  resultStatusMany(count) {
    return `${count} Weiterbildungen`;
  },
  noResults:
    'Keine Weiterbildung entspricht Ihrer aktuellen Suche und Kategorie. Versuchen Sie einen anderen Suchbegriff, wählen Sie eine andere Kategorie oder setzen Sie die Filter zurück.',
  errorFallback: 'Beim Laden des Verzeichnisses ist etwas schiefgelaufen.',

  // Card / list presentation labels
  resultsHeading: 'Weiterbildungen',
  scheduleHeading: 'CPD-Terminplan',
  readMore: 'Mehr lesen',
  location: 'Ort',
  category: 'Kategorie',
  alsoListedUnder: 'Auch gelistet unter',
  cpdHours: 'CPD-Stunden',
  format: 'Format',
  scheduleType: 'Art des Termins',
  nextStart: 'Nächster Termin',
  schedule: 'Durchführung',
  courseCta: 'Kursinformationen und Anmeldung',
  /**
   * @param {string} id
   * @returns {string}
   */
  courseRef(id) {
    return `Ref. ${id}`;
  },
  /**
   * @param {string} title
   * @returns {string}
   */
  courseImageAlt(title) {
    return `Kursbild für ${title}`;
  },
  /**
   * @param {string} title
   * @returns {string}
   */
  qrCodeAlt(title) {
    return `QR-Code für ${title}`;
  },
  scheduleColumns: Object.freeze([
    'Datum',
    'Weiterbildung',
    'PHC-CPD-Nummer',
    'Kategorie',
    'CPD-Credits',
  ]),
  emptyCell: '—',
});
