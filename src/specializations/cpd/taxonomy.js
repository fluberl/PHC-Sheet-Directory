/**
 * PHC CPD primary-category taxonomy — Milestone 10
 * Technical representation owned by the CPD specialization.
 * Conceptual source of truth remains the Knowledge taxonomy document.
 *
 * Governing principle: classify by Personal Health Coaching / health-promotion
 * domains, not by medical diagnoses.
 */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 * }} CpdPrimaryCategory
 *
 * @typedef {{
 *   id: string | null,
 *   label: string,
 *   supported: boolean,
 * }} ResolvedPrimaryCategory
 */

/** @type {readonly Readonly<CpdPrimaryCategory>[]} */
export const CPD_PRIMARY_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'lifestyle-medicine', label: 'Lifestyle Medicine' }),
  Object.freeze({
    id: 'mental-health-wellbeing',
    label: 'Mental Health & Wellbeing',
  }),
  Object.freeze({ id: 'womens-health', label: "Women's Health" }),
  Object.freeze({ id: 'mens-health', label: "Men's Health" }),
  Object.freeze({ id: 'healthy-ageing', label: 'Healthy Ageing' }),
  Object.freeze({
    id: 'prevention-health-promotion',
    label: 'Prevention & Health Promotion',
  }),
  Object.freeze({
    id: 'health-coaching-communication',
    label: 'Health Coaching & Communication',
  }),
  Object.freeze({ id: 'integrative-health', label: 'Integrative Health' }),
  Object.freeze({
    id: 'professional-development',
    label: 'Professional Development',
  }),
]);

/** @type {ReadonlyMap<string, Readonly<CpdPrimaryCategory>>} */
const BY_ID = new Map(CPD_PRIMARY_CATEGORIES.map((item) => [item.id, item]));

/** @type {ReadonlyMap<string, Readonly<CpdPrimaryCategory>>} */
const BY_LABEL = new Map(
  CPD_PRIMARY_CATEGORIES.map((item) => [normalizeKey(item.label), item]),
);

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeKey(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * @returns {readonly Readonly<CpdPrimaryCategory>[]}
 */
export function listPrimaryCategories() {
  return CPD_PRIMARY_CATEGORIES;
}

/**
 * @param {unknown} id
 * @returns {boolean}
 */
export function isKnownPrimaryCategoryId(id) {
  return typeof id === 'string' && BY_ID.has(id);
}

/**
 * @param {unknown} id
 * @returns {string | null}
 */
export function getPrimaryCategoryLabel(id) {
  if (typeof id !== 'string') {
    return null;
  }
  return BY_ID.get(id)?.label ?? null;
}

/**
 * Resolve a PUBLIC/domain primary-category string to a taxonomy entry.
 * Accepts stable ids or display labels (case-insensitive).
 *
 * @param {unknown} value
 * @returns {Readonly<ResolvedPrimaryCategory>}
 */
export function resolvePrimaryCategory(value) {
  if (typeof value !== 'string') {
    return Object.freeze({ id: null, label: '', supported: false });
  }

  const raw = value.trim();
  if (raw === '') {
    return Object.freeze({ id: null, label: '', supported: false });
  }

  const byId = BY_ID.get(raw);
  if (byId) {
    return Object.freeze({
      id: byId.id,
      label: byId.label,
      supported: true,
    });
  }

  const byLabel = BY_LABEL.get(normalizeKey(raw));
  if (byLabel) {
    return Object.freeze({
      id: byLabel.id,
      label: byLabel.label,
      supported: true,
    });
  }

  return Object.freeze({
    id: null,
    label: raw,
    supported: false,
  });
}
