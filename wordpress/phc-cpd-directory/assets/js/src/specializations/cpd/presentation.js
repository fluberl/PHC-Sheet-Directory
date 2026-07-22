/**
 * CPD presentation projection — Milestone 9
 * Maps immutable CPD domain entities to render-safe card display models.
 * Knows no German PUBLIC headings and emits no HTML/CSS/DOM.
 */

import { resolvePrimaryCategory } from './taxonomy.js';

/**
 * @typedef {import('./course.js').CpdCourse} CpdCourse
 *
 * @typedef {{
 *   name: string,
 *   websiteUrl?: string,
 *   logoUrl?: string,
 * }} CpdCardProvider
 *
 * @typedef {{
 *   primaryCategoryId?: string,
 *   primaryCategory?: string,
 *   primaryCategorySupported?: boolean,
 *   alsoListedUnder?: readonly string[],
 *   cpdHours?: number,
 * }} CpdCardClassification
 *
 * @typedef {{
 *   formats?: readonly string[],
 *   scheduleType?: string,
 *   nextStart?: string,
 *   scheduleDescription?: string,
 * }} CpdCardDelivery
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description?: string,
 *   fullDescription?: string,
 *   imageUrl?: string,
 *   qrCodeUrl?: string,
 *   provider: Readonly<CpdCardProvider>,
 *   location?: string,
 *   classification?: Readonly<CpdCardClassification>,
 *   delivery?: Readonly<CpdCardDelivery>,
 *   courseUrl?: string,
 * }} CpdCourseCardModel
 */

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Allow http(s) URLs, or root-relative paths for local demo media.
 * @param {unknown} value
 * @returns {string | undefined}
 */
function safeMediaUrl(value) {
  if (!isNonEmptyString(value)) {
    return undefined;
  }

  const text = value.trim();

  if (text.startsWith('/') && !text.startsWith('//')) {
    return text;
  }

  try {
    const parsed = new URL(text);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    return parsed.href;
  } catch {
    return undefined;
  }
}

/**
 * @param {readonly string[]} items
 * @returns {readonly string[] | undefined}
 */
function optionalStringList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return undefined;
  }

  return Object.freeze(items.slice());
}

/**
 * Short editorial copy for the card body (summary).
 * @param {CpdCourse} course
 * @returns {string | undefined}
 */
function projectShortDescription(course) {
  if (isNonEmptyString(course.course.summary)) {
    return course.course.summary;
  }
  return undefined;
}

/**
 * Optional long copy for disclosure only (detailed description).
 * Kept out of the default visible card body.
 * @param {CpdCourse} course
 * @returns {string | undefined}
 */
function projectFullDescription(course) {
  if (isNonEmptyString(course.course.description)) {
    return course.course.description;
  }
  return undefined;
}

/**
 * Project one immutable CPD entity into one immutable card display model.
 * Omission strategy: absent optional values are omitted (not null/N/A).
 *
 * @param {CpdCourse} course
 * @returns {Readonly<CpdCourseCardModel>}
 */
export function projectCpdCourseToCard(course) {
  if (course === null || typeof course !== 'object') {
    throw new Error('CPD card projection expected a CPD course entity.');
  }

  if (
    course.course === null ||
    typeof course.course !== 'object' ||
    course.provider === null ||
    typeof course.provider !== 'object'
  ) {
    throw new Error('CPD card projection expected nested course and provider.');
  }

  // Provider type is intentionally omitted from PUBLIC presentation.
  const provider = /** @type {CpdCardProvider} */ ({
    name: course.provider.name,
  });

  const providerWebsiteUrl = safeMediaUrl(course.provider.websiteUrl);
  if (providerWebsiteUrl && /^https?:/i.test(providerWebsiteUrl)) {
    provider.websiteUrl = providerWebsiteUrl;
  }

  const logoUrl = safeMediaUrl(course.provider.logoUrl);
  if (logoUrl) {
    provider.logoUrl = logoUrl;
  }

  /** @type {CpdCourseCardModel} */
  const model = {
    id: course.course.id,
    title: course.course.title,
    provider: Object.freeze(provider),
  };

  const description = projectShortDescription(course);
  if (description) {
    model.description = description;
  }

  const fullDescription = projectFullDescription(course);
  if (fullDescription) {
    model.fullDescription = fullDescription;
  }

  const imageUrl = safeMediaUrl(course.course.imageUrl);
  if (imageUrl) {
    model.imageUrl = imageUrl;
  }

  const qrCodeUrl = safeMediaUrl(course.course.qrCodeUrl);
  if (qrCodeUrl) {
    model.qrCodeUrl = qrCodeUrl;
  }

  if (isNonEmptyString(course.course.location)) {
    model.location = course.course.location;
  }

  /** @type {CpdCardClassification} */
  const classification = {};
  const primary = resolvePrimaryCategory(course.classification?.primaryCategory);
  if (primary.label !== '') {
    classification.primaryCategory = primary.label;
    classification.primaryCategorySupported = primary.supported;
    if (primary.id) {
      classification.primaryCategoryId = primary.id;
    }
  }

  const alsoListedUnder = optionalStringList(
    course.classification?.categories ?? [],
  );
  if (alsoListedUnder) {
    classification.alsoListedUnder = alsoListedUnder;
  }

  if (
    typeof course.course.cpdHours === 'number' &&
    Number.isFinite(course.course.cpdHours)
  ) {
    classification.cpdHours = course.course.cpdHours;
  }

  if (Object.keys(classification).length > 0) {
    model.classification = Object.freeze(classification);
  }

  /** @type {CpdCardDelivery} */
  const delivery = {};
  const formats = optionalStringList(course.delivery?.formats ?? []);
  if (formats) {
    delivery.formats = formats;
  }

  if (isNonEmptyString(course.delivery?.scheduleType)) {
    delivery.scheduleType = course.delivery.scheduleType;
  }

  if (isNonEmptyString(course.delivery?.nextStart)) {
    delivery.nextStart = course.delivery.nextStart;
  }

  if (isNonEmptyString(course.delivery?.scheduleDescription)) {
    delivery.scheduleDescription = course.delivery.scheduleDescription;
  }

  if (Object.keys(delivery).length > 0) {
    model.delivery = Object.freeze(delivery);
  }

  const courseUrl = safeMediaUrl(course.delivery?.courseUrl);
  if (courseUrl && /^https?:/i.test(courseUrl)) {
    model.courseUrl = courseUrl;
  }

  return Object.freeze(model);
}

/**
 * @param {readonly CpdCourse[]} courses
 * @returns {readonly Readonly<CpdCourseCardModel>[]}
 */
export function projectCpdCoursesToCards(courses) {
  if (!Array.isArray(courses)) {
    throw new Error('CPD card collection projection expected an array.');
  }

  return Object.freeze(courses.map((course) => projectCpdCourseToCard(course)));
}

/**
 * Project a SearchResult of CPD entities into card display models.
 *
 * @param {{ getAll: () => readonly unknown[] }} searchResult
 * @returns {readonly Readonly<CpdCourseCardModel>[]}
 */
export function projectCpdSearchResultToCards(searchResult) {
  return projectCpdCoursesToCards(
    /** @type {readonly CpdCourse[]} */ (searchResult.getAll()),
  );
}
