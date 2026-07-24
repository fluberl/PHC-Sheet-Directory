/**
 * Milestone 14 — German localization, Swiss dates, PHC taxonomy, multi-category
 */

import {
  CPD_PRIMARY_CATEGORIES,
  CPD_VIEW_MODE_OPTIONS,
  cpdRecordAccessors,
  formatSwissDateLong,
  formatSwissDateShort,
  mapPublicRowsToCpdCourses,
  projectCpdCourseToCard,
  resolvePrimaryCategory,
} from '../src/specializations/cpd/index.js';
import { cpdDirectoryCopy } from '../src/specializations/cpd/copy.js';
import { createCpdCourseCard } from '../src/specializations/cpd/render-cards.js';
import { createCpdChronologicalList } from '../src/specializations/cpd/render-list.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import assert from 'node:assert/strict';
import { createCatalog } from '../src/catalog/catalog.js';
import { searchCatalog } from '../src/search/search.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Minimal DOM for Node tests (same pattern as earlier milestones).
 */
function installMinimalDom() {
  const previous = globalThis.document;

  class FakeNode {
    constructor(tagName = '', className = '') {
      this.tagName = String(tagName).toUpperCase();
      this.className = className;
      this.childNodes = [];
      this.attributes = Object.create(null);
      this.textContent = '';
      this.value = '';
      this.selected = false;
      this.options = [];
    }

    setAttribute(name, value) {
      this.attributes[name] = String(value);
    }

    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name]
        : null;
    }

    appendChild(child) {
      this.childNodes.push(child);
      if (this.tagName === 'SELECT' && child.tagName === 'OPTION') {
        this.options.push(child);
      }
      return child;
    }
  }

  globalThis.document = {
    createElement(tag) {
      return new FakeNode(tag);
    },
  };

  return () => {
    globalThis.document = previous;
  };
}

/**
 * @param {FakeNode} rootNode
 * @param {string} className
 */
function findByClass(rootNode, className) {
  /** @type {FakeNode[]} */
  const found = [];
  /** @param {FakeNode} node */
  function walk(node) {
    if (
      typeof node.className === 'string' &&
      node.className.split(/\s+/).includes(className)
    ) {
      found.push(node);
    }
    for (const child of node.childNodes ?? []) {
      walk(child);
    }
  }
  walk(rootNode);
  return found;
}

/**
 * @param {FakeNode} rootNode
 * @param {string} tag
 */
function findByTag(rootNode, tag) {
  const upper = tag.toUpperCase();
  /** @type {FakeNode[]} */
  const found = [];
  /** @param {FakeNode} node */
  function walk(node) {
    if (node.tagName === upper) {
      found.push(node);
    }
    for (const child of node.childNodes ?? []) {
      walk(child);
    }
  }
  walk(rootNode);
  return found;
}

const fixture = JSON.parse(
  readFileSync(join(root, 'examples/public/sample-public.json'), 'utf8'),
);
const courses = mapPublicRowsToCpdCourses(fixture);
const catalog = createCatalog(courses, cpdRecordAccessors);

// --- PHC taxonomy labels ---
{
  assert.equal(CPD_PRIMARY_CATEGORIES.length, 9, 'nine PHC categories');
  assert.equal(
    CPD_PRIMARY_CATEGORIES.map((item) => item.label).join('|'),
    [
      'Lifestyle Medicine',
      'Mentale Gesundheit & Wohlbefinden',
      'Frauengesundheit',
      'Männergesundheit',
      'Gesund altern',
      'Prävention & Gesundheitsförderung',
      'Health Coaching & Kommunikation',
      'Integrative Gesundheit',
      'Berufliche Entwicklung',
    ].join('|'),
    'PHC display labels',
  );

  const alias = resolvePrimaryCategory("Women's Health");
  assert.equal(alias.id, 'womens-health', 'legacy English alias');
  assert.equal(alias.label, 'Frauengesundheit', 'canonical German label');

  const german = resolvePrimaryCategory('Frauengesundheit');
  assert.equal(german.id, 'womens-health', 'German label resolves');
}

// --- Swiss date formatting ---
{
  assert.equal(formatSwissDateLong('2026-08-17'), '17. August 2026', 'long Swiss date');
  assert.equal(formatSwissDateShort('2026-08-17'), '17.08.2026', 'short Swiss date');
  assert.equal(formatSwissDateLong('17.08.2026'), '17. August 2026', 'from DD.MM.YYYY');
}

// --- German discovery copy ---
{
  assert.equal(cpdDirectoryCopy.searchLabel, 'Weiterbildungen suchen');
  assert.equal(cpdDirectoryCopy.categoryLabel, 'Kategorie');
  assert.equal(cpdDirectoryCopy.allCategoriesLabel, 'Alle Kategorien');
  assert.equal(cpdDirectoryCopy.viewLabel, 'Ansicht');
  assert.equal(cpdDirectoryCopy.resultStatusMany(3), '3 Weiterbildungen');
  assert.match(cpdDirectoryCopy.loading, /Weiterbildungen werden geladen/);
}

// --- multi-category filtering ---
{
  const lifestyle = searchCatalog(
    catalog,
    { text: '', categoryId: 'lifestyle-medicine' },
    cpdRecordAccessors,
  );
  assert.equal(lifestyle.size, 1, 'lifestyle primary');

  const prevention = searchCatalog(
    catalog,
    { text: '', categoryId: 'prevention-health-promotion' },
    cpdRecordAccessors,
  );
  assert.equal(prevention.size, 2, 'prevention via secondary on two courses');
  assert.deepEqual(
    prevention.getAll().map((course) => course.course.id).sort(),
    ['PHC-CPD-010', 'PHC-CPD-040'],
  );

  const womens = searchCatalog(
    catalog,
    { text: '', categoryId: 'womens-health' },
    cpdRecordAccessors,
  );
  assert.equal(womens.size, 2, 'womens primary + lifestyle secondary');
  assert.deepEqual(
    womens.getAll().map((course) => course.course.id).sort(),
    ['PHC-CPD-010', 'PHC-CPD-020'],
  );

  const professional = searchCatalog(
    catalog,
    { text: '', categoryId: 'professional-development' },
    cpdRecordAccessors,
  );
  assert.equal(professional.size, 1, 'professional via secondary');
  assert.equal(professional.getAll()[0].course.id, 'PHC-CPD-001');
}

// --- search still works ---
{
  assert.ok(
    searchCatalog(catalog, { text: 'menopause' }, cpdRecordAccessors).size >= 1,
    'content search',
  );
  assert.ok(
    searchCatalog(
      catalog,
      { text: 'Lifestyle Medicine' },
      cpdRecordAccessors,
    ).size >= 1,
    'taxonomy label search',
  );
}

// --- rendered dates and German chrome ---
{
  const uninstall = installMinimalDom();
  try {
    const card = projectCpdCourseToCard(courses[0]);
    assert.equal(
      card.classification?.primaryCategory,
      'Health Coaching & Kommunikation',
      'projected primary label',
    );
    assert.ok(
      card.classification?.alsoListedUnder?.includes('Berufliche Entwicklung'),
      'secondary taxonomy label projected',
    );

    const article = createCpdCourseCard(card);
    const terms = findByClass(article, 'phc-directory__card-meta-term').map(
      (node) => node.textContent,
    );
    assert.ok(terms.includes('Nächster Termin'), 'next start label DE');
    assert.ok(terms.includes('Ort'), 'location label DE');
    assert.ok(
      !terms.includes('CPD-Stunden') && !terms.includes('WB-Stunden*'),
      'hours live outside meta terms',
    );
    assert.ok(
      findByClass(article, 'phc-directory__card-hours-label').some(
        (node) => node.textContent === 'WB-Stunden*',
      ),
      'hours label DE',
    );
    assert.ok(
      findByClass(article, 'phc-directory__card-cta').some((node) =>
        node.textContent.includes('Kursinformationen'),
      ),
      'CTA DE',
    );

    const time = findByTag(article, 'time')[0];
    assert.equal(time.getAttribute('datetime'), '2026-09-01', 'iso datetime kept');
    assert.equal(time.textContent, '1. September 2026', 'long Swiss display');

    const list = createCpdChronologicalList([card]);
    const listTime = findByTag(list, 'time')[0];
    assert.equal(listTime.textContent, '01.09.2026', 'short Swiss display');
    assert.equal(
      findByTag(list, 'h2')[0].textContent,
      'CPD-Terminplan',
      'schedule heading DE',
    );
  } finally {
    uninstall();
  }
}

// --- view mode labels ---
{
  const calendar = CPD_VIEW_MODE_OPTIONS.find((item) => item.id === 'calendar');
  assert.equal(calendar?.label, 'Nach Datum', 'calendar view label');
  assert.equal(
    CPD_VIEW_MODE_OPTIONS.find((item) => item.id === 'catalogue')?.label,
    'Katalog',
    'catalogue view label unchanged',
  );
  assert.equal(
    CPD_VIEW_MODE_OPTIONS.find((item) => item.id === 'chronological')?.label,
    'Chronologische Liste',
    'chronological view label unchanged',
  );
  assert.ok(
    !CPD_VIEW_MODE_OPTIONS.some((item) => item.label === 'Kalenderkarten'),
    'obsolete Kalenderkarten removed',
  );

  const viewModesSrc = readFileSync(
    join(root, 'src/specializations/cpd/view-modes.js'),
    'utf8',
  );
  assert.ok(viewModesSrc.includes("'Nach Datum'"), 'source has Nach Datum');
  assert.ok(!viewModesSrc.includes('Kalenderkarten'), 'source drops Kalenderkarten');
}

console.log('Milestone 14 localization / taxonomy / dates checks passed.');
