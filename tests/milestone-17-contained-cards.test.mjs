/**
 * Milestone 17 — contained PHC cards and coherent metadata reading flow.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'assets/styles/phc-directory.css'), 'utf8');

console.log('Running Milestone 17 contained-card tests…');

{
  assert.match(
    css,
    /\.phc-directory__card\s*\{[^}]*background:\s*#fff/s,
    'white card background',
  );
  assert.match(
    css,
    /\.phc-directory__card\s*\{[^}]*border:\s*1px\s+solid\s+var\(--phc-edgewater\)/s,
    'Edgewater card border',
  );
  assert.match(
    css,
    /\.phc-directory__card\s*\{[^}]*border-radius:\s*0\.5rem/s,
    'rounded card corners',
  );
  assert.match(
    css,
    /\.phc-directory__card\s*\{[^}]*box-shadow:/s,
    'card has outside shadow',
  );
  assert.match(
    css,
    /\.phc-directory__card\s*\{[^}]*padding:\s*1\.5rem/s,
    'generous card padding',
  );
  assert.match(
    css,
    /\.phc-directory__card-list\s*\{[^}]*gap:\s*2rem/s,
    'generous spacing between cards',
  );
  assert.doesNotMatch(
    css,
    /\.phc-directory__card\s*\{[^}]*border-top:\s*1px\s+solid\s+#cfcfcf/s,
    'legacy hairline separator removed',
  );
}

{
  assert.doesNotMatch(
    css,
    /\.phc-directory__card::before\s*\{/,
    'accent strip removed in later refinement',
  );
}

{
  assert.match(
    css,
    /\.phc-directory__card-meta\s*\{[^}]*flex-direction:\s*column/s,
    'each metadata column remains a vertical reading flow',
  );
  assert.match(
    css,
    /\.phc-directory__card-details\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)/s,
    'details use two logical columns (M18)',
  );
}

{
  assert.match(
    css,
    /nth-child\(even\)\s+\.phc-directory__card-media\s*\{[^}]*grid-column:\s*2/s,
    'M16 alternation preserved',
  );
  assert.match(
    css,
    /@media\s*\(\s*min-width:\s*40\.0625rem\s*\)[\s\S]*justify-self:\s*end/,
    'M16 image-right alignment preserved',
  );
  assert.match(css, /max-width:\s*1040px/, 'M15 width preserved');
  assert.match(css, /"Open Sans",\s*Arial,\s*sans-serif/, 'M15 typography preserved');
  assert.match(css, /#b7dbd1/, 'M15 Edgewater token preserved');
}

console.log('All Milestone 17 contained-card tests passed.');
