/**
 * CPD directory UI copy — Milestone 10
 * Specialization-owned strings for the generic lifecycle shell.
 */

export const cpdDirectoryCopy = Object.freeze({
  loading: 'Loading CPD offerings…',
  empty: 'No CPD offerings are currently available.',
  searchLabel: 'Search courses',
  categoryLabel: 'Category',
  allCategoriesLabel: 'All categories',
  resultStatusNone: 'No matching courses',
  resultStatusOne: '1 course',
  /**
   * @param {number} count
   * @returns {string}
   */
  resultStatusMany(count) {
    return `${count} courses`;
  },
  noResults:
    'No CPD courses match your current search and category. Try another search term, choose another category, or clear the filters.',
  errorFallback: 'Something went wrong while loading the directory.',
});
