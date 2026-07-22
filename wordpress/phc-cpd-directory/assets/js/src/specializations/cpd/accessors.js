/**
 * CPD record accessors for generic Catalog / Search — Milestone 14
 */

import { createRecordAccessors } from '../../domain/accessors.js';
import { resolvePrimaryCategory } from './taxonomy.js';

/**
 * @param {unknown} entry
 * @returns {import('./course.js').CpdCourse}
 */
function asCourse(entry) {
  return /** @type {import('./course.js').CpdCourse} */ (entry);
}

/**
 * Collect all supported taxonomy ids for a course (primary + secondary).
 * @param {import('./course.js').CpdCourse} course
 * @returns {readonly string[]}
 */
export function collectCpdCategoryIds(course) {
  /** @type {string[]} */
  const ids = [];
  /** @type {Set<string>} */
  const seen = new Set();

  /**
   * @param {unknown} value
   */
  function addResolved(value) {
    const resolved = resolvePrimaryCategory(value);
    if (resolved.supported && resolved.id && !seen.has(resolved.id)) {
      seen.add(resolved.id);
      ids.push(resolved.id);
    }
  }

  addResolved(course.classification?.primaryCategory);
  if (Array.isArray(course.classification?.categories)) {
    for (const item of course.classification.categories) {
      addResolved(item);
    }
  }

  return Object.freeze(ids);
}

/**
 * Build searchable text from CPD domain fields (not PUBLIC headings).
 * @param {import('./course.js').CpdCourse} course
 * @returns {string}
 */
export function buildCpdSearchableText(course) {
  const primaryRaw =
    typeof course.classification?.primaryCategory === 'string'
      ? course.classification.primaryCategory
      : '';
  const primary = resolvePrimaryCategory(primaryRaw);
  const secondaryRaw = Array.isArray(course.classification?.categories)
    ? course.classification.categories
    : [];
  const secondaryResolved = secondaryRaw
    .map((item) => resolvePrimaryCategory(item).label)
    .filter((label) => label !== '');

  return [
    course.course?.title,
    course.provider?.name,
    course.course?.summary,
    course.course?.description,
    primaryRaw,
    primary.label,
    ...secondaryRaw,
    ...secondaryResolved,
    Array.isArray(course.course?.languages)
      ? course.course.languages.join(' ')
      : '',
  ]
    .filter((part) => typeof part === 'string' && part.trim() !== '')
    .join(' ');
}

/**
 * @type {Readonly<import('../../domain/accessors.js').RecordAccessors>}
 */
export const cpdRecordAccessors = createRecordAccessors({
  getId(entry) {
    const id = asCourse(entry)?.course?.id;
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('CPD accessor expected course.id string.');
    }
    return id;
  },
  getTitle(entry) {
    const title = asCourse(entry)?.course?.title;
    if (typeof title !== 'string') {
      throw new Error('CPD accessor expected course.title string.');
    }
    return title;
  },
  getSearchableText(entry) {
    return buildCpdSearchableText(asCourse(entry));
  },
  getPrimaryCategoryId(entry) {
    const resolved = resolvePrimaryCategory(
      asCourse(entry)?.classification?.primaryCategory,
    );
    return resolved.supported ? resolved.id : null;
  },
  getCategoryIds(entry) {
    return collectCpdCategoryIds(asCourse(entry));
  },
});
