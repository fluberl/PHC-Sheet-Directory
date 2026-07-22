/**
 * PHC CPD course domain entity — Milestone 8
 * Deeply immutable nested CPD directory record.
 * Knows no German PUBLIC headings.
 */

import {
  normalizeCpdHours,
  normalizeText,
  parseStringList,
} from './normalize.js';

/**
 * @typedef {{
 *   type: string,
 *   name: string,
 *   websiteUrl: string,
 *   logoUrl: string,
 * }} CpdProvider
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   shortTitle: string,
 *   summary: string,
 *   description: string,
 *   location: string,
 *   cpdHours: number | null,
 *   imageUrl: string,
 *   qrCodeUrl: string,
 *   languages: readonly string[],
 * }} CpdCourseInfo
 *
 * @typedef {{
 *   primaryCategory: string,
 *   categories: readonly string[],
 * }} CpdClassification
 *
 * @typedef {{
 *   formats: readonly string[],
 *   scheduleType: string,
 *   nextStart: string,
 *   scheduleDescription: string,
 *   courseUrl: string,
 * }} CpdDelivery
 *
 * @typedef {{
 *   provider: Readonly<CpdProvider>,
 *   course: Readonly<CpdCourseInfo>,
 *   classification: Readonly<CpdClassification>,
 *   delivery: Readonly<CpdDelivery>,
 * }} CpdCourse
 */

/**
 * @param {{
 *   providerType?: unknown,
 *   providerName?: unknown,
 *   providerWebsiteUrl?: unknown,
 *   providerLogoUrl?: unknown,
 *   courseId?: unknown,
 *   title?: unknown,
 *   shortTitle?: unknown,
 *   summary?: unknown,
 *   description?: unknown,
 *   location?: unknown,
 *   cpdHours?: unknown,
 *   imageUrl?: unknown,
 *   qrCodeUrl?: unknown,
 *   primaryCategory?: unknown,
 *   additionalCategories?: unknown,
 *   languages?: unknown,
 *   formats?: unknown,
 *   scheduleType?: unknown,
 *   nextStart?: unknown,
 *   scheduleDescription?: unknown,
 *   courseUrl?: unknown,
 * }} input
 * @returns {Readonly<CpdCourse>}
 */
export function createCpdCourse(input) {
  const providerName = normalizeText(input?.providerName);
  const courseId = normalizeText(input?.courseId);
  const title = normalizeText(input?.title);

  if (courseId === '') {
    throw new Error('CPD course requires course.id.');
  }

  if (title === '') {
    throw new Error('CPD course requires course.title.');
  }

  if (providerName === '') {
    throw new Error('CPD course requires provider.name.');
  }

  let cpdHours;
  try {
    cpdHours = normalizeCpdHours(input?.cpdHours);
  } catch {
    cpdHours = null;
  }

  const categories = parseStringList(input?.additionalCategories);
  const formats = parseStringList(input?.formats);
  const languages = parseStringList(input?.languages);

  const provider = Object.freeze({
    type: normalizeText(input?.providerType),
    name: providerName,
    websiteUrl: normalizeText(input?.providerWebsiteUrl),
    logoUrl: normalizeText(input?.providerLogoUrl),
  });

  const course = Object.freeze({
    id: courseId,
    title,
    shortTitle: normalizeText(input?.shortTitle),
    summary: normalizeText(input?.summary),
    description: normalizeText(input?.description),
    location: normalizeText(input?.location),
    cpdHours,
    imageUrl: normalizeText(input?.imageUrl),
    qrCodeUrl: normalizeText(input?.qrCodeUrl),
    languages,
  });

  const classification = Object.freeze({
    primaryCategory: normalizeText(input?.primaryCategory),
    categories,
  });

  const delivery = Object.freeze({
    formats,
    scheduleType: normalizeText(input?.scheduleType),
    nextStart: normalizeText(input?.nextStart),
    scheduleDescription: normalizeText(input?.scheduleDescription),
    courseUrl: normalizeText(input?.courseUrl),
  });

  return Object.freeze({
    provider,
    course,
    classification,
    delivery,
  });
}
