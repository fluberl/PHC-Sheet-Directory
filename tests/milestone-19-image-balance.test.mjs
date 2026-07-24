/**
 * Milestone 19 — desktop image balance (center within media column).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'assets/styles/phc-directory.css'), 'utf8');

console.log('Running Milestone 19 image-balance tests…');

{
  const desktopBlock = css.match(
    /@media\s*\(\s*min-width:\s*40\.0625rem\s*\)\s*\{([\s\S]*?)\n\}/,
  );
  assert.ok(desktopBlock, 'desktop breakpoint present');
  const desktop = desktopBlock[1];

  assert.match(
    desktop,
    /\.phc-directory__card-media\s*\{[^}]*justify-self:\s*center/s,
    'media centered',
  );
  assert.match(
    desktop,
    /width:\s*320px/,
    '320px width retained',
  );
  assert.match(
    desktop,
    /height:\s*320px/,
    '320px height retained',
  );
  assert.doesNotMatch(desktop, /justify-self:\s*start/);
  assert.doesNotMatch(desktop, /justify-self:\s*end/);
}

{
  assert.match(
    css,
    /nth-child\(even\)\s+\.phc-directory__card-media\s*\{[^}]*grid-column:\s*2/s,
    'alternation retained',
  );
  assert.match(
    css,
    /@media\s*\(\s*max-width:\s*40rem\s*\)[\s\S]*\.phc-directory__card-media-row\s*\{[^}]*grid-template-columns:\s*1fr/s,
    'mobile stack retained',
  );
}

console.log('All Milestone 19 image-balance tests passed.');
