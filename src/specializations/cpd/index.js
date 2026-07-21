/**
 * PHC CPD specialization public surface — Milestone 11
 */

export { createCpdCourse } from './course.js';
export {
  normalizeText,
  normalizeCpdHours,
  parseStringList,
} from './normalize.js';
export {
  PUBLIC_COLUMNS,
  mapPublicRowToCpdCourse,
  mapPublicRowsToCpdCourses,
} from './map-public-row.js';
export {
  buildCpdSearchableText,
  cpdRecordAccessors,
} from './accessors.js';
export { cpdDirectoryCopy } from './copy.js';
export {
  CPD_PRIMARY_CATEGORIES,
  getPrimaryCategoryLabel,
  isKnownPrimaryCategoryId,
  listPrimaryCategories,
  resolvePrimaryCategory,
} from './taxonomy.js';
export {
  projectCpdCourseToCard,
  projectCpdCoursesToCards,
  projectCpdSearchResultToCards,
} from './presentation.js';
export {
  createCpdCourseCard,
  createCpdCourseCardList,
} from './render-cards.js';
export {
  CPD_VIEW_MODE_OPTIONS,
  DEFAULT_CPD_VIEW_MODE,
  normalizeViewMode,
} from './view-modes.js';
export { sortCardsByNextStart } from './sort.js';
export { createCpdChronologicalList } from './render-list.js';
export { createCpdResultsView } from './render-views.js';
