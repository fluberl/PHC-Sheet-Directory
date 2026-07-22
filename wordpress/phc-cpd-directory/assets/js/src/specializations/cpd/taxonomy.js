/**
 * PHC CPD primary-category taxonomy — Milestone 14
 * Technical representation owned by the CPD specialization.
 * Conceptual source of truth remains the Knowledge taxonomy document.
 *
 * Governing principle: classify by Personal Health Coaching / health-promotion
 * domains, not by medical diagnoses.
 *
 * Display labels follow the PHC Schweiz taxonomy (Swiss German wording).
 * Some professional terms intentionally remain English (e.g. Lifestyle Medicine).
 * Legacy English labels are accepted as aliases so existing sheet rows resolve.
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
    label: 'Mentale Gesundheit & Wohlbefinden',
  }),
  Object.freeze({ id: 'womens-health', label: 'Frauengesundheit' }),
  Object.freeze({ id: 'mens-health', label: 'Männergesundheit' }),
  Object.freeze({ id: 'healthy-ageing', label: 'Gesund altern' }),
  Object.freeze({
    id: 'prevention-health-promotion',
    label: 'Prävention & Gesundheitsförderung',
  }),
  Object.freeze({
    id: 'health-coaching-communication',
    label: 'Health Coaching & Kommunikation',
  }),
  Object.freeze({ id: 'integrative-health', label: 'Integrative Gesundheit' }),
  Object.freeze({
    id: 'professional-development',
    label: 'Berufliche Entwicklung',
  }),
]);

/**
 * Legacy / alternate display labels that resolve to the same stable ids.
 * @type {readonly (readonly [string, string])[]}
 */
const LABEL_ALIASES = Object.freeze([
  Object.freeze(['Mental Health & Wellbeing', 'mental-health-wellbeing']),
  Object.freeze(["Women's Health", 'womens-health']),
  Object.freeze(["Men's Health", 'mens-health']),
  Object.freeze(['Healthy Ageing', 'healthy-ageing']),
  Object.freeze([
    'Prevention & Health Promotion',
    'prevention-health-promotion',
  ]),
  Object.freeze([
    'Health Coaching & Communication',
    'health-coaching-communication',
  ]),
  Object.freeze(['Integrative Health', 'integrative-health']),
  Object.freeze(['Professional Development', 'professional-development']),
]);

/** @type {ReadonlyMap<string, Readonly<CpdPrimaryCategory>>} */
const BY_ID = new Map(CPD_PRIMARY_CATEGORIES.map((item) => [item.id, item]));

/** @type {ReadonlyMap<string, Readonly<CpdPrimaryCategory>>} */
const BY_LABEL = new Map();

for (const item of CPD_PRIMARY_CATEGORIES) {
  BY_LABEL.set(normalizeKey(item.label), item);
}

for (const [alias, id] of LABEL_ALIASES) {
  const item = BY_ID.get(id);
  if (item) {
    BY_LABEL.set(normalizeKey(alias), item);
  }
}

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
 * Accepts stable ids, current display labels, or legacy English aliases
 * (case-insensitive).
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
