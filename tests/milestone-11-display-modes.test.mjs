/**
 * Milestone 11 tests — display modes over the filtered dataset.
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
  CPD_VIEW_MODE_OPTIONS,
  DEFAULT_CPD_VIEW_MODE,
  cpdDirectoryCopy,
  cpdRecordAccessors,
  createCpdResultsView,
  listPrimaryCategories,
  mapPublicRowsToCpdCourses,
  normalizeViewMode,
  projectCpdSearchResultToCards,
  sortCardsByNextStart,
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
      this.options = [];
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

  const originalCreateElement = undefined;
  globalThis.document = {
    createElement(tagName) {
      const el = new Element(tagName);
      if (String(tagName).toLowerCase() === 'select') {
        const appendChild = el.appendChild.bind(el);
        el.appendChild = (child) => {
          const result = appendChild(child);
          if (child && child.tagName === 'OPTION') {
            el.options.push(child);
          }
          return result;
        };
      }
      return el;
    },
    createTextNode(data) {
      return new TextNode(data);
    },
  };
  void originalCreateElement;

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

function cardIds(cards) {
  return cards.map((card) => card.id);
}

console.log('Running Milestone 11 display-mode tests…');

const fixture = JSON.parse(
  readFileSync(join(root, 'examples/public/sample-public.json'), 'utf8'),
);
const courses = mapPublicRowsToCpdCourses(fixture);
const catalog = createCatalog(courses, cpdRecordAccessors);
const transport = validateTransportRows(fixture);
const catalogueCards = projectCpdSearchResultToCards(
  searchCatalog(catalog, { text: '', categoryId: '' }, cpdRecordAccessors),
);

// --- view mode helpers ---
{
  assert(DEFAULT_CPD_VIEW_MODE === 'calendar', 'default is calendar');
  assert(CPD_VIEW_MODE_OPTIONS.length === 3, 'three view options');
  assert(normalizeViewMode('catalogue') === 'catalogue', 'catalogue mode');
  assert(normalizeViewMode('chronological') === 'chronological', 'list mode');
  assert(normalizeViewMode('nope') === 'calendar', 'invalid falls back');
}

// --- sorting ---
{
  const sorted = sortCardsByNextStart(catalogueCards);
  assert(
    cardIds(sorted).join('|') ===
      'PHC-CPD-005|PHC-CPD-001|PHC-CPD-030|PHC-CPD-010|PHC-CPD-020|PHC-CPD-040',
    'calendar date order',
  );
  assert(
    cardIds(catalogueCards).join('|') ===
      'PHC-CPD-001|PHC-CPD-005|PHC-CPD-010|PHC-CPD-020|PHC-CPD-030|PHC-CPD-040',
    'catalogue source order unchanged by sort helper',
  );

  const withMissing = sortCardsByNextStart([
    { id: 'B', delivery: { nextStart: '2026-10-01' } },
    { id: 'A', delivery: {} },
    { id: 'C', delivery: { nextStart: '2026-09-01' } },
  ]);
  assert(cardIds(withMissing).join('|') === 'C|B|A', 'missing dates last');
}

// --- view mode does not change filtered results ---
{
  const state = createState();
  const searchResult = searchCatalog(
    catalog,
    { text: '', categoryId: '' },
    cpdRecordAccessors,
  );
  state.setReady({
    validationResult: transport,
    entries: courses,
    catalog,
    searchResult,
    searchText: '',
    categoryId: '',
    viewMode: DEFAULT_CPD_VIEW_MODE,
    recordAccessors: cpdRecordAccessors,
    projectResults: (next) => projectCpdSearchResultToCards(next),
  });

  assert(state.getSnapshot().viewMode === 'calendar', 'ready default calendar');

  state.setCategoryId('mental-health-wellbeing');
  state.setSearchText('stress');
  const filtered = state.getSnapshot();
  assert(filtered.resultCount === 1, 'filtered before mode switch');
  assert(filtered.categoryId === 'mental-health-wellbeing', 'category kept');
  assert(filtered.searchText === 'stress', 'search kept');
  const resultIds = cardIds(filtered.results);

  state.setViewMode('catalogue');
  assert(state.getSnapshot().viewMode === 'catalogue', 'mode catalogue');
  assert(state.getSnapshot().resultCount === 1, 'count unchanged');
  assert(
    cardIds(state.getSnapshot().results).join('|') === resultIds.join('|'),
    'results unchanged by catalogue mode',
  );

  state.setViewMode('chronological');
  assert(state.getSnapshot().viewMode === 'chronological', 'mode list');
  assert(state.getSnapshot().resultCount === 1, 'count still one');
  assert(state.getSnapshot().searchText === 'stress', 'search persists');
  assert(
    state.getSnapshot().categoryId === 'mental-health-wellbeing',
    'category persists',
  );

  state.setSearchText('');
  assert(state.getSnapshot().viewMode === 'chronological', 'mode survives clear search');
  assert(state.getSnapshot().resultCount === 3, 'category-only after clear search');

  state.setCategoryId('');
  assert(state.getSnapshot().viewMode === 'chronological', 'mode survives clear category');
  assert(state.getSnapshot().resultCount === fixture.length, 'all results restored');
}

// --- renderer selection ---
{
  const uninstall = installMinimalDom();
  try {
    const calendar = createCpdResultsView(catalogueCards, 'calendar');
    assert(
      findByClass(calendar, 'phc-directory__card-list').length === 1,
      'calendar uses cards',
    );
    const calendarCards = findByClass(calendar, 'phc-directory__card');
    assert(calendarCards.length === catalogueCards.length, 'calendar card count');
    assert(
      calendarCards[0].getAttribute('data-phc-course-id') === 'PHC-CPD-005',
      'calendar earliest first',
    );

    const catalogue = createCpdResultsView(catalogueCards, 'catalogue');
    const catalogueCardNodes = findByClass(catalogue, 'phc-directory__card');
    assert(
      catalogueCardNodes[0].getAttribute('data-phc-course-id') === 'PHC-CPD-001',
      'catalogue keeps source order',
    );

    const list = createCpdResultsView(catalogueCards, 'chronological');
    assert(
      findByClass(list, 'phc-directory__schedule').length === 1,
      'chronological table',
    );
    assert(findByClass(list, 'phc-directory__card-list').length === 0, 'no cards in list');
    const rows = findByClass(list, 'phc-directory__schedule-row');
    assert(rows[0].getAttribute('data-phc-course-id') === 'PHC-CPD-005', 'list date order');
    assert(findByTag(list, 'a').length >= 1, 'course title links present');
    const headings = findByTag(list, 'th').map((node) => node.textContent);
    assert(
      headings.join('|') ===
        'Datum|Weiterbildung|PHC-CPD-Nummer|Kategorie|CPD-Credits',
      'schedule columns',
    );
  } finally {
    uninstall();
  }
}

// --- discovery shell includes View control ---
{
  const uninstall = installMinimalDom();
  try {
    const view = createLifecycleView(
      {
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: courses.length,
        resultCount: courses.length,
        searchText: '',
        categoryId: '',
        viewMode: 'catalogue',
        results: catalogueCards,
      },
      {
        copy: cpdDirectoryCopy,
        categoryOptions: listPrimaryCategories().map((item) => ({
          id: item.id,
          label: item.label,
        })),
        viewModeOptions: CPD_VIEW_MODE_OPTIONS.map((item) => ({
          id: item.id,
          label: item.label,
        })),
        renderResults(snapshot) {
          return createCpdResultsView(
            /** @type {typeof catalogueCards} */ (snapshot.results ?? []),
            snapshot.viewMode,
          );
        },
      },
    );

    assert(findByClass(view, 'phc-directory__view-label').length === 1, 'view label');
    const selects = findByTag(view, 'select');
    assert(selects.length === 2, 'category + view selects');
    const viewSelect = selects.find((node) =>
      Object.prototype.hasOwnProperty.call(node.attributes, 'data-phc-view'),
    );
    assert(viewSelect, 'view select present');
    assert(
      viewSelect.options.some(
        (option) => option.value === 'catalogue' && option.selected === true,
      ),
      'catalogue selected',
    );
    assert(
      findByClass(view, 'phc-directory__card')[0].getAttribute(
        'data-phc-course-id',
      ) === 'PHC-CPD-001',
      'ready view renders catalogue order',
    );
  } finally {
    uninstall();
  }
}

console.log('All Milestone 11 display-mode tests passed.');
