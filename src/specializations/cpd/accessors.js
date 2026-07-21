/**
 * CPD record accessors for generic Catalog / Search — Milestone 8
 */

import { createRecordAccessors } from '../../domain/accessors.js';

/**
 * @type {Readonly<import('../../domain/accessors.js').RecordAccessors>}
 */
export const cpdRecordAccessors = createRecordAccessors({
  getId(entry) {
    const id = entry?.course?.id;
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('CPD accessor expected course.id string.');
    }
    return id;
  },
  getTitle(entry) {
    const title = entry?.course?.title;
    if (typeof title !== 'string') {
      throw new Error('CPD accessor expected course.title string.');
    }
    return title;
  },
});
