/**
 * Milestone 9 tests — CPD presentation projection and course-card rendering.
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
  createCpdCourse,
  cpdDirectoryCopy,
  cpdRecordAccessors,
  mapPublicRowsToCpdCourses,
  projectCpdCourseToCard,
  projectCpdSearchResultToCards,
} from '../src/specializations/cpd/index.js';
import {
  createCpdCourseCard,
  createCpdCourseCardList,
} from '../src/specializations/cpd/render-cards.js';
import { render } from '../src/render/render.js';
import { defaultDirectoryCopy } from '../src/render/states.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Minimal DOM for card rendering tests (no browser dependency).
 */
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
      this.selectionStart = 0;
      this.selectionEnd = 0;
    }

    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === 'id') {
        this.id = String(value);
      }
    }

    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name]
        : null;
    }

    matches(selector) {
      if (selector === '[data-phc-search]') {
        return Object.prototype.hasOwnProperty.call(
          this.attributes,
          'data-phc-search',
        );
      }
      if (selector.startsWith('.')) {
        return this.className.split(/\s+/).includes(selector.slice(1));
      }
      return false;
    }

    contains(node) {
      let current = node;
      while (current) {
        if (current === this) {
          return true;
        }
        current = current.parentNode;
      }
      return false;
    }

    querySelector(selector) {
      /** @type {object[]} */
      const stack = [...this.childNodes];
      while (stack.length > 0) {
        const node = stack.shift();
        if (!node || node.nodeType !== 1) {
          continue;
        }
        if (node.matches(selector)) {
          return node;
        }
        stack.push(...node.childNodes);
      }
      return null;
    }

    replaceChildren(...nodes) {
      this.childNodes.forEach((child) => {
        child.parentNode = null;
      });
      this.childNodes = [];
      nodes.forEach((node) => {
        this.appendChild(node);
      });
    }

    focus() {
      document.activeElement = this;
    }

    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    }

    get textContent() {
      if (this.childNodes.length === 0) {
        return this._text;
      }
      return this.childNodes.map((child) => child.textContent).join('');
    }

    set textContent(value) {
      this.childNodes = [];
      this._text = String(value);
    }
  }

  globalThis.document = {
    activeElement: null,
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

/**
 * @param {object} node
 * @param {string} tagName
 * @returns {object[]}
 */
function findByTag(node, tagName) {
  /** @type {object[]} */
  const found = [];
  const want = tagName.toUpperCase();

  function walk(current) {
    if (!current || current.nodeType !== 1) {
      return;
    }
    if (current.tagName === want) {
      found.push(current);
    }
    (current.childNodes || []).forEach(walk);
  }

  walk(node);
  return found;
}

/**
 * @param {object} node
 * @param {string} className
 * @returns {object[]}
 */
function findByClass(node, className) {
  /** @type {object[]} */
  const found = [];

  function walk(current) {
    if (!current || current.nodeType !== 1) {
      return;
    }
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

console.log('Running Milestone 9 tests…');

const publicRows = JSON.parse(
  readFileSync(join(root, 'examples/public/sample-public.json'), 'utf8'),
);

// --- presentation projection ---
{
  const transport = validateTransportRows(publicRows);
  assert(transport.valid, 'fixture transport valid');
  const courses = mapPublicRowsToCpdCourses(publicRows);
  const card = projectCpdCourseToCard(courses[0]);

  assert(card.id === 'PHC-CPD-001', 'card id');
  assert(card.title === 'Health Coaching Fundamentals', 'card title');
  assert(card.provider.name === 'Coaching Institut Living Sense', 'provider');
  assert(card.provider.websiteUrl === 'https://example.org/living-sense', 'url');
  assert(card.provider.logoUrl === '/assets/demo/logo-living-sense.svg', 'logo');
  assert(!('type' in card.provider), 'provider type omitted from presentation');
  assert(card.classification?.cpdHours === 24, 'cpd hours');
  assert(card.courseUrl === 'https://example.org/courses/health-coaching', 'course url');
  assert(typeof card.description === 'string' && card.description.length > 40, 'description');
  assert(card.imageUrl === '/assets/demo/course-cis.svg', 'course image');
  assert(card.classification?.primaryCategoryId === 'health-coaching-communication', 'primary id');
  assert(card.classification?.primaryCategorySupported === true, 'supported primary');
  assert(
    Array.isArray(card.classification?.alsoListedUnder),
    'alsoListedUnder secondary list',
  );

  const second = projectCpdCourseToCard(courses[1]);
  assert(second.qrCodeUrl === '/assets/demo/qr-easybits.svg', 'second qr');
  assert(second.imageUrl === '/assets/demo/course-easybits.svg', 'second image');
  assert(!('logoUrl' in second.provider), 'omit empty logo');

  const serialized = JSON.stringify(card);
  assert(!serialized.includes('Anbietertyp'), 'no German Anbietertyp');
  assert(!serialized.includes('Vollständiger Titel'), 'no German title heading');
  assert(!serialized.includes('PHC-CPD-ID'), 'no German PHC-CPD-ID heading');

  const before = JSON.stringify(courses[0]);
  projectCpdCourseToCard(courses[0]);
  assert(JSON.stringify(courses[0]) === before, 'projection does not mutate entity');

  assert(Object.isFrozen(card), 'card frozen');
  assert(Object.isFrozen(card.provider), 'provider frozen');
  assert(Object.isFrozen(card.classification), 'classification frozen');
  assert(Object.isFrozen(card.delivery), 'delivery frozen');

  const sparse = createCpdCourse({
    providerName: 'Sparse Provider',
    courseId: 'PHC-CPD-SPARSE',
    title: 'Sparse Course',
    providerType: 'Einzelanbieter',
    providerWebsiteUrl: '',
    summary: '',
    location: '',
    cpdHours: '',
    primaryCategory: '',
    additionalCategories: '',
    formats: '',
    scheduleType: '',
    nextStart: '',
    scheduleDescription: '',
    courseUrl: 'not-a-url',
  });
  const sparseCard = projectCpdCourseToCard(sparse);
  assert(sparseCard.id === 'PHC-CPD-SPARSE', 'sparse id');
  assert(!('description' in sparseCard), 'omit empty description');
  assert(!('imageUrl' in sparseCard), 'omit empty image');
  assert(!('qrCodeUrl' in sparseCard), 'omit empty qr');
  assert(!('location' in sparseCard), 'omit empty location');
  assert(!('classification' in sparseCard), 'omit empty classification group');
  assert(!('delivery' in sparseCard), 'omit empty delivery group');
  assert(!('courseUrl' in sparseCard), 'omit invalid course url');
  assert(!('type' in sparseCard.provider), 'omit provider type even when domain has it');
  assert(!('websiteUrl' in sparseCard.provider), 'omit empty provider url');
  assert(!('logoUrl' in sparseCard.provider), 'omit empty logo');
}

// --- card rendering ---
{
  const uninstall = installMinimalDom();
  try {
    const courses = mapPublicRowsToCpdCourses(publicRows);
    const cards = projectCpdSearchResultToCards({
      getAll: () => courses,
    });
    const list = createCpdCourseCardList(cards);
    const articles = findByTag(list, 'article');
    assert(articles.length === cards.length, 'article count');
    assert(findByTag(list, 'h2').length === 1, 'results heading');
    assert(findByTag(articles[0], 'h3')[0].textContent.includes('Health Coaching'), 'title heading');

    const first = createCpdCourseCard(cards[0]);
    assert(first.getAttribute('data-phc-course-id') === 'PHC-CPD-001', 'data id');
    assert(findByClass(first, 'phc-directory__card-provider-row').length === 1, 'provider row');
    assert(findByClass(first, 'phc-directory__card-provider-logo').length === 1, 'provider logo');
    assert(findByClass(first, 'phc-directory__card-provider-type').length === 0, 'no provider type');
    assert(findByClass(first, 'phc-directory__card-media-row').length === 1, 'media row');
    assert(findByClass(first, 'phc-directory__card-photo').length === 1, 'course photo');
    assert(findByClass(first, 'phc-directory__card-description-text').length === 1, 'description');
    assert(
      findByClass(first, 'phc-directory__card-meta-term').some(
        (node) => node.textContent === 'CPD hours',
      ),
      'CPD hours label',
    );
    assert(
      !findByClass(first, 'phc-directory__card-meta-term').some(
        (node) => node.textContent === 'Recognition',
      ),
      'no Recognition label',
    );
    assert(findByClass(first, 'phc-directory__card-footer').length === 1, 'footer');

    const idNode = findByClass(first, 'phc-directory__card-id')[0];
    assert(idNode.textContent === 'Ref. PHC-CPD-001', 'quiet reference text');

    const second = createCpdCourseCard(cards[1]);
    assert(findByClass(second, 'phc-directory__card-qr').length === 1, 'qr present when available');
    assert(findByClass(second, 'phc-directory__card-provider-logo').length === 0, 'no empty logo');

    const links = findByTag(first, 'a');
    assert(links.length >= 1, 'has links');
    links.forEach((link) => {
      assert(typeof link.getAttribute('href') === 'string', 'href present');
      assert(link.textContent.trim() !== '', 'descriptive link text');
      assert(link.getAttribute('href').startsWith('http'), 'http(s) link');
    });

    const sparseCard = projectCpdCourseToCard(
      createCpdCourse({
        providerName: 'Only Provider',
        courseId: 'PHC-CPD-ONLY',
        title: 'Only Title',
      }),
    );
    const sparseArticle = createCpdCourseCard(sparseCard);
    assert(
      findByClass(sparseArticle, 'phc-directory__card-photo-placeholder').length === 1,
      'photo placeholder when missing',
    );
    assert(findByClass(sparseArticle, 'phc-directory__card-actions').length === 1, 'actions shell');
    assert(findByTag(sparseArticle, 'a').length === 0, 'no empty registration link');
    assert(findByTag(sparseArticle, 'dl').length === 0, 'no empty meta');
    assert(findByClass(sparseArticle, 'phc-directory__card-qr').length === 0, 'no empty qr');
  } finally {
    uninstall();
  }
}

// --- lifecycle / state behaviour ---
{
  const uninstall = installMinimalDom();
  try {
    assert(
      !defaultDirectoryCopy.loading.includes('CPD'),
      'generic default copy is neutral',
    );

    const loading = createLifecycleView(
      {
        lifecycle: 'loading',
        errorMessage: null,
        rowCount: null,
        resultCount: null,
        searchText: '',
        results: [],
      },
      { copy: cpdDirectoryCopy },
    );
    assert(loading.textContent.includes('Loading CPD offerings'), 'loading copy');

    const empty = createLifecycleView(
      {
        lifecycle: 'empty',
        errorMessage: null,
        rowCount: 0,
        resultCount: 0,
        searchText: '',
        results: [],
      },
      { copy: cpdDirectoryCopy },
    );
    assert(
      empty.textContent.includes('No CPD offerings are currently available.'),
      'empty catalog copy',
    );

    const noResults = createLifecycleView(
      {
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: 2,
        resultCount: 0,
        searchText: 'zzzz',
        categoryId: '',
        results: [],
      },
      { copy: cpdDirectoryCopy },
    );
    assert(noResults.textContent.includes('No CPD courses match'), 'no-results copy');
    assert(!noResults.textContent.includes('Loaded (Catalog)'), 'no diagnostic loaded');

    const courses = mapPublicRowsToCpdCourses(publicRows);
    const catalog = createCatalog(courses, cpdRecordAccessors);
    const searchResult = searchCatalog(catalog, { text: '' }, cpdRecordAccessors);
    const state = createState();
    state.setReady({
      validationResult: { valid: true, errors: [] },
      entries: courses,
      catalog,
      searchResult,
      searchText: '',
      recordAccessors: cpdRecordAccessors,
      projectResults: (next) => projectCpdSearchResultToCards(next),
    });
    assert(state.getSnapshot().results.length === courses.length, 'ready cards');
    assert(state.getSnapshot().results[0].title.includes('Health Coaching'), 'card title in snapshot');

    state.setSearchText('easybits');
    assert(state.getSnapshot().resultCount === 1, 'search hit count');
    assert(state.getSnapshot().results[0].id === 'PHC-CPD-005', 'search hit id');

    state.setSearchText('zzzz');
    assert(state.getSnapshot().resultCount === 0, 'no match count');
    assert(state.getSnapshot().lifecycle === 'ready', 'ready retained on zero matches');

    const error = createLifecycleView({
      lifecycle: 'error',
      errorMessage: 'Public message only',
      rowCount: null,
      resultCount: null,
      searchText: '',
      results: [],
    });
    assert(error.textContent === 'Public message only', 'error message');

    // Focus restore across remount
    const mount = document.createElement('div');
    state.setSearchText('');
    render(mount, state.getSnapshot(), { copy: cpdDirectoryCopy });
    const input = mount.querySelector('[data-phc-search]');
    assert(input, 'search input present');
    input.focus();
    input.selectionStart = 1;
    input.selectionEnd = 1;
    document.activeElement = input;

    state.setSearchText('ea');
    render(mount, state.getSnapshot(), { copy: cpdDirectoryCopy });
    const restored = mount.querySelector('[data-phc-search]');
    assert(document.activeElement === restored, 'search focus restored');
    assert(restored.selectionStart === 1, 'selection start restored');
  } finally {
    uninstall();
  }
}

// --- host isolation (structural) ---
{
  const uninstall = installMinimalDom();
  try {
    const hostHeader = 'PHC Schweiz (host header — must not be modified by the app)';
    const hostFooter = 'PHC Schweiz (host footer — must not be modified by the app)';
    const mount = document.createElement('div');
    mount.id = 'phc-cpd-directory';

    const courses = mapPublicRowsToCpdCourses(publicRows);
    const cards = projectCpdSearchResultToCards({ getAll: () => courses });
    const view = createLifecycleView(
      {
        lifecycle: 'ready',
        errorMessage: null,
        rowCount: cards.length,
        resultCount: cards.length,
        searchText: '',
        categoryId: '',
        results: cards,
      },
      {
        copy: cpdDirectoryCopy,
        renderResults(snapshot) {
          return createCpdCourseCardList(
            /** @type {import('../src/specializations/cpd/presentation.js').CpdCourseCardModel[]} */ (
              snapshot.results
            ),
          );
        },
      },
    );
    mount.appendChild(view);

    assert(hostHeader.includes('host header'), 'header text intact constant');
    assert(hostFooter.includes('host footer'), 'footer text intact constant');
    assert(mount.id === 'phc-cpd-directory', 'mount id unchanged');
    assert(
      findByClass(mount, 'phc-directory__card').length === cards.length,
      'cards inside mount',
    );
  } finally {
    uninstall();
  }
}

console.log('All Milestone 9 tests passed.');
