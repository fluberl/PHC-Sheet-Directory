/**
 * Milestone 18 — card information hierarchy (accent, two-column meta, CTA, WB metric).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCpdCourse } from '../src/specializations/cpd/course.js';
import { projectCpdCourseToCard } from '../src/specializations/cpd/presentation.js';
import { createCpdCourseCard } from '../src/specializations/cpd/render-cards.js';
import { cpdDirectoryCopy } from '../src/specializations/cpd/copy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'assets/styles/phc-directory.css'), 'utf8');

function installMinimalDom() {
  const previous = globalThis.document;

  class FakeNode {
    constructor(tagName = '', className = '') {
      this.tagName = String(tagName).toUpperCase();
      this.className = className;
      this.childNodes = [];
      this.attributes = Object.create(null);
      this.textContent = '';
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
 * @param {any} rootNode
 * @param {string} className
 */
function findByClass(rootNode, className) {
  /** @type {any[]} */
  const found = [];
  /** @param {any} node */
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

console.log('Running Milestone 18 card hierarchy tests…');

{
  assert.doesNotMatch(
    css,
    /\.phc-directory__card::before\s*\{/,
    'vertical accent strip removed',
  );
  assert.match(
    css,
    /\.phc-directory__card\s*\{[^}]*border:\s*1px\s+solid\s+var\(--phc-edgewater\)/s,
    'Edgewater border preserved',
  );
  assert.match(
    css,
    /\.phc-directory__card\s*\{[^}]*box-shadow:/s,
    'shadow preserved',
  );
  assert.match(
    css,
    /\.phc-directory__card-details\s*\{[^}]*grid-template-areas:[\s\S]*'identity delivery'[\s\S]*'cta delivery'/s,
    'desktop CTA under left column',
  );
  assert.match(
    css,
    /\.phc-directory__card-cta\s*\{[^}]*background:\s*var\(--phc-edgewater\)/s,
    'Edgewater CTA background',
  );
  assert.match(
    css,
    /\.phc-directory__card-cta\s*\{[^}]*font-weight:\s*700/s,
    'bold CTA text',
  );
  assert.match(
    css,
    /\.phc-directory__card-cta\s*\{[^}]*justify-self:\s*end/s,
    'desktop CTA right-aligned in left column',
  );
  assert.match(
    css,
    /\.phc-directory__card-hours-value\s*,[\s\S]*\.phc-directory__card-meta-value|\.phc-directory__card-meta-value[\s\S]*\.phc-directory__card-hours-value/,
    'WB value shares metadata value typography',
  );
  assert.match(
    css,
    /@media\s*\(\s*max-width:\s*40rem\s*\)[\s\S]*grid-template-areas:[\s\S]*'identity'[\s\S]*'delivery'[\s\S]*'cta'/,
    'mobile stacks identity then delivery then CTA',
  );
  assert.match(
    css,
    /@media\s*\(\s*max-width:\s*40rem\s*\)[\s\S]*\.phc-directory__card-cta\s*\{[^}]*justify-self:\s*center/s,
    'mobile CTA centered',
  );
}

{
  assert.equal(cpdDirectoryCopy.cpdHours, 'WB-Stunden*');
  assert.equal(cpdDirectoryCopy.wbHoursFootnote, '* Weiterbildungsstunden');
  assert.equal(cpdDirectoryCopy.courseCta, 'Kursinformationen & Anmeldung');
  assert.equal(cpdDirectoryCopy.courseRef('PHC-WB-001'), 'PHC-WB-001');
}

{
  const uninstall = installMinimalDom();
  try {
    const card = projectCpdCourseToCard(
      createCpdCourse({
        providerName: 'Provider',
        courseId: 'PHC-WB-001',
        title: 'Title',
        location: 'Basel',
        primaryCategory: 'health-coaching-communication',
        additionalCategories: 'professional-development',
        formats: 'Präsenz',
        scheduleType: 'Einmalig',
        scheduleDescription: 'Tagesseminar',
        nextStart: '2027-02-20',
        cpdHours: 24,
        courseUrl: 'https://example.com/course',
        summary: 'Short',
      }),
    );
    const article = createCpdCourseCard(card);

    assert.equal(findByClass(article, 'phc-directory__card-details').length, 1);
    assert.equal(
      findByClass(article, 'phc-directory__card-meta--identity').length,
      1,
    );
    assert.equal(
      findByClass(article, 'phc-directory__card-meta--delivery').length,
      1,
    );

    const identityTerms = findByClass(
      findByClass(article, 'phc-directory__card-meta--identity')[0],
      'phc-directory__card-meta-term',
    ).map((node) => node.textContent);
    assert.deepEqual(identityTerms, [
      'Ort',
      'Kategorie',
      'Auch gelistet unter',
      'Nächster Termin',
    ]);

    const deliveryTerms = findByClass(
      findByClass(article, 'phc-directory__card-meta--delivery')[0],
      'phc-directory__card-meta-term',
    ).map((node) => node.textContent);
    assert.deepEqual(deliveryTerms, ['Format', 'Durchführung', 'Art des Termins']);

    const cta = findByClass(article, 'phc-directory__card-cta')[0];
    assert.equal(cta.textContent, 'Kursinformationen & Anmeldung');

    assert.equal(
      findByClass(article, 'phc-directory__card-hours-label')[0].textContent,
      'WB-Stunden*',
    );
    assert.equal(
      findByClass(article, 'phc-directory__card-hours-value')[0].textContent,
      '24',
    );
    assert.equal(
      findByClass(article, 'phc-directory__card-id')[0].textContent,
      'PHC-WB-001',
    );
    assert.equal(
      findByClass(article, 'phc-directory__card-hours-footnote')[0].textContent,
      '* Weiterbildungsstunden',
    );
  } finally {
    uninstall();
  }
}

{
  assert.match(css, /max-width:\s*1040px/, 'M15 width intact');
  assert.match(
    css,
    /@media\s*\(\s*min-width:\s*40\.0625rem\s*\)[\s\S]*justify-self:\s*center/,
    'M16/M19 media centering intact',
  );
}

console.log('All Milestone 18 card hierarchy tests passed.');
