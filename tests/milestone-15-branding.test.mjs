/**
 * Milestone 15 — desktop width, deterministic UI typography, light PHC branding.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CPD_VIEW_MODE_OPTIONS } from '../src/specializations/cpd/view-modes.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'assets/styles/phc-directory.css'), 'utf8');

console.log('Running Milestone 15 branding / layout tests…');

{
  assert.match(css, /\.phc-directory\s*\{[^}]*width:\s*100%/s, 'full width');
  assert.match(css, /max-width:\s*1040px/, 'max-width 1040px');
  assert.match(css, /margin-inline:\s*auto/, 'centered');
}

{
  assert.match(
    css,
    /--phc-ui-font:\s*"Open Sans",\s*Arial,\s*sans-serif/,
    'Open Sans token',
  );
  assert.match(
    css,
    /\.phc-directory__search-label[\s\S]*?font-family:\s*var\(--phc-ui-font\)/,
    'label UI font',
  );
  assert.match(
    css,
    /\.phc-directory__search-input[\s\S]*?font-family:\s*var\(--phc-ui-font\)/,
    'input UI font',
  );
  assert.match(
    css,
    /\.phc-directory__result-status[\s\S]*?font-family:\s*var\(--phc-ui-font\)/,
    'result status UI font',
  );
  assert.doesNotMatch(
    css,
    /\.phc-directory__discovery[\s\S]*?font-family:\s*inherit/,
    'discovery must not rely on inherit',
  );
}

{
  assert.match(css, /--phc-green:\s*#235853/, 'PHC Green');
  assert.match(css, /--phc-tango:\s*#e76827/, 'Tango Orange');
  assert.match(css, /--phc-edgewater:\s*#b7dbd1/, 'Edgewater');
  assert.match(css, /--phc-grey:\s*#808080/, 'Grey');
  assert.match(
    css,
    /\.phc-directory__search-input[\s\S]*?background:\s*var\(--phc-edgewater\)/,
    'control background',
  );
  assert.match(
    css,
    /\.phc-directory__search-input[\s\S]*?border:\s*1px\s+solid\s+var\(--phc-green\)/,
    'control border',
  );
  assert.match(
    css,
    /\.phc-directory__search-input:focus[\s\S]*?outline:\s*2px\s+solid\s+var\(--phc-tango\)/,
    'focus outline tango',
  );
  assert.match(
    css,
    /\.phc-directory__search-input::placeholder[\s\S]*?opacity:\s*0\.55/,
    'placeholder opacity',
  );
  assert.match(css, /--phc-control-radius:\s*0\.25rem/, 'subtle radius');
}

{
  assert.match(
    css,
    /\.phc-directory__results\s*\{[^}]*Georgia,\s*'Times New Roman',\s*serif/s,
    'results remain serif',
  );
  assert.match(
    css,
    /\.phc-directory__card-title[\s\S]*?Georgia,\s*'Times New Roman',\s*serif/,
    'card title remains serif',
  );
}

{
  assert.equal(
    CPD_VIEW_MODE_OPTIONS.map((item) => item.label).join('|'),
    'Nach Datum|Katalog|Chronologische Liste',
    'view labels unchanged',
  );
}

console.log('All Milestone 15 branding / layout tests passed.');
