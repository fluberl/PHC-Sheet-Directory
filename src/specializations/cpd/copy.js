/**
 * CPD directory UI copy — Milestone 9
 * Specialization-owned strings for the generic lifecycle shell.
 */

export const cpdDirectoryCopy = Object.freeze({
  loading: 'Loading CPD offerings…',
  empty: 'No CPD offerings are currently available.',
  searchLabel: 'Search courses by title',
  resultStatusNone: 'No matching courses',
  resultStatusOne: '1 course',
  /**
   * @param {number} count
   * @returns {string}
   */
  resultStatusMany(count) {
    return `${count} courses`;
  },
  /**
   * @param {string} term
   * @returns {string}
   */
  noResultsWithTerm(term) {
    return `No courses match “${term}”. Try another search term, or clear the search field.`;
  },
  noResults: 'No courses match the current search.',
  errorFallback: 'Something went wrong while loading the directory.',
});
