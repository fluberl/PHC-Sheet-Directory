/**
 * Milestone 10 tests — taxonomy, discovery search, category filtering.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCatalog } from '../src/catalog/catalog.js';
import { createState } from '../src/state/state.js';
import { searchCatalog } from '../src/search/search.js';
import { createLifecycleView } from '../src/render/states.js';
import { validateTransportRows } from '../src/schema/transport.js';
import {
  CPD_PRIMARY_CATEGORIES,
  cpdDirectoryCopy,
  cpdRecordAccessors,
  isKnownPrimaryCategoryId,
  listPrimaryCategories,
  mapPublicRowsToCpdCourses,
  projectCpdCourseToCard,
  projectCpdSearchResultToCards,
  resolvePrimaryCategory,
} from '../src/specializations/cpd/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function installMinimalDom() {
  class Node {
    constructor() {
      this.childNodes = [];
      this.parentNode = null;
    }

    appendChild(child) {
      this.childNodes.push(child);
      child.parentNode = this;
      return child;
    }
  }

  class TextNode extends Node {
    constructor(data) {
      super();
      this.nodeType = 3;
      this.data = String(data);
    }

    get textContent() {
      return this.data;
    }
  }

  class Element extends Node {
    constructor(tagName) {
      super();
      this.nodeType = 1;
      this.tagName = String(tagName).toUpperCase();
      this.attributes = Object.create(null);
      this.className = '';
      this.id = '';
      this._text = '';
      this.value = '';
      this.selected = false;
    }

    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === 'id') this.id = String(value);
    }

    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name]
        : null;
    }

    matches(selector) {
      if (selector.startsWith('[') && selector.endsWith(']')) {
        const attr = selector.slice(1, -1);
        return Object.prototype.hasOwnProperty.call(this.attributes, attr);
      }
      if (selector.startsWith('.')) {
        return this.className.split(/\s+/).includes(selector.slice(1));
      }
      return false;
    }

    querySelector(selector) {
      const stack = [...this.childNodes];
      while (stack.length) {
        const node = stack.shift();
        if (!node || node.nodeType !== 1) continue;
        if (node.matches(selector)) return node;
        stack.push(...node.childNodes);
      }
      return null;
    }

    get textContent() {
      if (this.childNodes.length === 0) return this._text;
      return this.childNodes.map((child) => child.textContent).join('');
    }

    set textContent(value) {
      this.childNodes = [];
      this._text = String(value);
    }
  }

  globalThis.document = {
    createElement(tagName) {
      return new Element(tagName);
    },
    createTextNode(data) {
      return new TextNode(data);
    },
  };

  return () => {
    delete globalThis.document;
  };
}

function findByTag(node, tagName) {
  const found = [];
  const want = tagName.toUpperCase();
  function walk(current) {
    if (!current || current.nodeType !== 1) return;
    if (current.tagName === want) found.push(current);
    (current.childNodes || []).forEach(walk);
  }
  walk(node);
  return found;
}

function findByClass(node, className) {
  const found = [];
  function walk(current) {
    if (!current || current.nodeType !== 1) return;
    if (
      typeof current.className === 'string' &&
      current.className.split(/\s+/).includes(className)
    ) {
      found.push(current);
    }
    (current.childNodes || []).forEach(walk);
  }
  walk(node);
  return found;
}

console.log('Running Milestone 10 discovery tests…');

const fixture = JSON.parse(
  readFileSync(join(root, 'examples/public/sample-public.json'), 'utf8'),
);
const courses = mapPublicRowsToCpdCourses(fixture);
const catalog = createCatalog(courses, cpdRecordAccessors);

// --- taxonomy ---
{
  assert(listPrimaryCategories().length === 9, 'nine primary categories');
  assert(
    CPD_PRIMARY_CATEGORIES.map((item) => item.id).join('|') ===
      'lifestyle-medicine|mental-health-wellbeing|womens-health|mens-health|healthy-ageing|prevention-health-promotion|health-coaching-communication|integrative-health|professional-development',
    'stable ordered ids',
  );
  assert(isKnownPrimaryCategoryId('womens-health'), 'known id');
  assert(!isKnownPrimaryCategoryId('diabetes'), 'disease not primary');
  const resolved = resolvePrimaryCategory('Mental Health & Wellbeing');
  assert(resolved.supported && resolved.id === 'mental-health-wellbeing', 'label resolve');
  const unsupported = resolvePrimaryCategory('Cardiology');
  assert(!unsupported.supported && unsupported.label === 'Cardiology', 'unsupported surfaced');
}

// --- search fields ---
{
  assert(searchCatalog(catalog, { text: 'health coaching' }, cpdRecordAccessors).size >= 1, 'title');
  assert(searchCatalog(catalog, { text: 'ALPINE LIFESTYLE' }, cpdRecordAccessors).size === 1, 'provider');
  assert(searchCatalog(catalog, { text: '  diabetes  ' }, cpdRecordAccessors).size >= 1, 'description/secondary diabetes');
  assert(searchCatalog(catalog, { text: 'menopause' }, cpdRecordAccessors).size >= 1, 'menopause content');
  assert(searchCatalog(catalog, { text: 'falls prevention' }, cpdRecordAccessors).size >= 1, 'falls prevention');
  assert(searchCatalog(catalog, { text: 'stress regulation' }, cpdRecordAccessors).size >= 1, 'secondary stress');
  assert(
    searchCatalog(catalog, { text: 'Lifestyle Medicine' }, cpdRecordAccessors).size >= 1,
    'primary label search',
  );
}

// --- category filtering ---
{
  const all = searchCatalog(catalog, { text: '', categoryId: '' }, cpdRecordAccessors);
  assert(all.size === fixture.length, 'all categories');

  const mental = searchCatalog(
    catalog,
    { text: '', categoryId: 'mental-health-wellbeing' },
    cpdRecordAccessors,
  );
  assert(mental.size === 1, 'one mental health course');
  assert(mental.getAll()[0].course.id === 'PHC-CPD-005', 'mental id');

  const none = searchCatalog(
    catalog,
    { text: '', categoryId: 'integrative-health' },
    cpdRecordAccessors,
  );
  assert(none.size === 0, 'category with no courses');

  const mens = searchCatalog(
    catalog,
    { text: '', categoryId: 'mens-health' },
    cpdRecordAccessors,
  );
  assert(mens.size === 1 && mens.getAll()[0].course.id === 'PHC-CPD-030', 'mens health');
}

// --- combined discovery via state ---
{
  const transport = validateTransportRows(fixture);
  const state = createState();
  const searchResult = searchCatalog(catalog, { text: '', categoryId: '' }, cpdRecordAccessors);
  state.setReady({
    validationResult: transport,
    entries: courses,
    catalog,
    searchResult,
    searchText: '',
    categoryId: '',
    recordAccessors: cpdRecordAccessors,
    projectResults: (next) => projectCpdSearchResultToCards(next),
  });

  assert(state.getSnapshot().resultCount === fixture.length, 'search only empty');

  state.setCategoryId('mental-health-wellbeing');
  assert(state.getSnapshot().categoryId === 'mental-health-wellbeing', 'category set');
  assert(state.getSnapshot().resultCount === 1, 'category only');

  state.setSearchText('stress');
  assert(state.getSnapshot().resultCount === 1, 'search plus category');

  state.setSearchText('zzzz-no-match');
  assert(state.getSnapshot().resultCount === 0, 'zero-result combination');
  assert(state.getSnapshot().lifecycle === 'ready', 'ready retained');

  state.setSearchText('');
  assert(state.getSnapshot().resultCount === 1, 'clear search keep category');

  state.setCategoryId('');
  assert(state.getSnapshot().resultCount === fixture.length, 'clear category keep search empty');

  state.setSearchText('diabetes');
  assert(state.getSnapshot().resultCount >= 1, 'search only disease term');
  state.setCategoryId('lifestyle-medicine');
  assert(state.getSnapshot().resultCount >= 1, 'diabetes within lifestyle');
}

// --- unsupported primary category ---
{
  const { createCpdCourse } = await import('../src/specializations/cpd/course.js');
  const unsupported = createCpdCourse({
    providerName: 'Test Provider',
    courseId: 'PHC-CPD-X',
    title: 'Unsupported Category Course',
    primaryCategory: 'Unknown Domain',
    additionalCategories: 'Type 2 Diabetes',
  });
  const card = projectCpdCourseToCard(unsupported);
  assert(card.classification?.primaryCategory === 'Unknown Domain', 'raw label kept');
  assert(card.classification?.primaryCategorySupported === false, 'unsupported flag');
  assert(!('primaryCategoryId' in (card.classification ?? {})), 'no id when unsupported');
  assert(
    cpdRecordAccessors.getPrimaryCategoryId(unsupported) === null,
    'filter ignores unsupported',
  );
}

// --- rendering / a11y controls ---
{
  const uninstall = installMinimalDom();
  try {
    const cards = projectCpdSearchResultToCards({ getAll: () => courses });
    const view = createLifecycleView(
      {
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: courses.length,
        resultCount: courses.length,
        searchText: '',
        categoryId: 'womens-health',
        results: cards,
      },
      {
        copy: cpdDirectoryCopy,
        categoryOptions: listPrimaryCategories().map((item) => ({
          id: item.id,
          label: item.label,
        })),
      },
    );

    assert(findByClass(view, 'phc-directory__search-label').length === 1, 'search label');
    assert(findByClass(view, 'phc-directory__category-label').length === 1, 'category label');
    const select = findByTag(view, 'select')[0];
    assert(select, 'category select');
    const options = findByTag(select, 'option');
    assert(options[0].value === '' && options[0].textContent.includes('All categories'), 'all option');
    assert(options.some((option) => option.value === 'lifestyle-medicine'), 'option values');
    assert(
      options.some(
        (option) => option.value === 'womens-health' && option.selected === true,
      ),
      'selected category',
    );
    assert(findByClass(view, 'phc-directory__result-status')[0].textContent.includes('course'), 'count');

    const empty = createLifecycleView(
      {
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: courses.length,
        resultCount: 0,
        searchText: 'none',
        categoryId: 'mens-health',
        results: [],
      },
      {
        copy: cpdDirectoryCopy,
        categoryOptions: listPrimaryCategories().map((item) => ({
          id: item.id,
          label: item.label,
        })),
      },
    );
    assert(
      empty.textContent.includes('No CPD courses match your current search and category'),
      'empty state',
    );

    const { createCpdCourseCard } = await import(
      '../src/specializations/cpd/render-cards.js'
    );
    const cardNode = createCpdCourseCard(cards[0]);
    const mediaRow = findByClass(cardNode, 'phc-directory__card-media-row')[0];
    assert(mediaRow.childNodes[0].className.includes('card-media'), 'photo first in DOM');
    assert(
      mediaRow.childNodes[1].className.includes('card-description'),
      'description second in DOM',
    );
  } finally {
    uninstall();
  }
}

console.log('All Milestone 10 discovery tests passed.');
