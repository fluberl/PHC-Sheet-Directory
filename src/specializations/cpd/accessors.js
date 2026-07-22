/**
 * CPD record accessors for generic Catalog / Search — Milestone 10
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
 * Build searchable text from CPD domain fields (not PUBLIC headings).
 * @param {import('./course.js').CpdCourse} course
 * @returns {string}
 */
export function buildCpdSearchableText(course) {
  const primary = resolvePrimaryCategory(course.classification?.primaryCategory);
  const secondary = Array.isArray(course.classification?.categories)
    ? course.classification.categories.join(' ')
    : '';

  return [
    course.course?.title,
    course.provider?.name,
    course.course?.summary,
    course.course?.description,
    primary.label,
    secondary,
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
});
