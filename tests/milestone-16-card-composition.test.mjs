/**
 * Milestone 16 — desktop card composition (alternating alignment + image size).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'assets/styles/phc-directory.css'), 'utf8');

console.log('Running Milestone 16 desktop card composition tests…');

{
  assert.match(
    css,
    /nth-child\(even\)\s+\.phc-directory__card-media\s*\{[^}]*grid-column:\s*2/s,
    'even cards keep image in right column',
  );
  assert.match(
    css,
    /nth-child\(even\)\s+\.phc-directory__card-description\s*\{[^}]*grid-column:\s*1/s,
    'even cards keep description in left column',
  );
  assert.doesNotMatch(
    css,
    /phc-directory__card[\s\S]*\border\s*:/,
    'alternation must not use CSS order',
  );
}

{
  const desktopBlock = css.match(
    /@media\s*\(\s*min-width:\s*40\.0625rem\s*\)\s*\{([\s\S]*?)\n\}/,
  );
  assert.ok(desktopBlock, 'desktop min-width breakpoint present');
  const desktop = desktopBlock[1];

  assert.match(
    desktop,
    /\.phc-directory__card-media\s*\{[^}]*justify-self:\s*center/s,
    'desktop media centered in column',
  );
  assert.match(
    desktop,
    /nth-child\(even\)\s+\.phc-directory__card-media\s*\{[^}]*justify-self:\s*center/s,
    'even cards also center media in column',
  );
  assert.doesNotMatch(
    desktop,
    /justify-self:\s*start|justify-self:\s*end/,
    'no edge-anchored media alignment',
  );
  assert.match(
    desktop,
    /\.phc-directory__card-photo[\s\S]*?width:\s*320px/,
    'desktop photo width 320px',
  );
  assert.match(
    desktop,
    /\.phc-directory__card-photo[\s\S]*?height:\s*320px/,
    'desktop photo height 320px',
  );
  assert.match(
    desktop,
    /\.phc-directory__card-photo[\s\S]*?max-width:\s*320px/,
    'desktop photo max-width 320px',
  );
}

{
  assert.match(
    css,
    /\.phc-directory__card-photo[\s\S]*?object-fit:\s*cover/,
    'course photos keep object-fit cover',
  );
  assert.match(
    css,
    /\.phc-directory__card-qr-image[\s\S]*?object-fit:\s*contain/,
    'QR images keep object-fit contain',
  );
}

{
  const mobileBlock = css.match(
    /@media\s*\(\s*max-width:\s*40rem\s*\)\s*\{([\s\S]*?)\n\}/,
  );
  assert.ok(mobileBlock, 'mobile max-width breakpoint preserved');
  const mobile = mobileBlock[1];
  assert.match(
    mobile,
    /\.phc-directory__card-media-row\s*\{[^}]*grid-template-columns:\s*1fr/s,
    'mobile stacks to one column',
  );
  assert.doesNotMatch(mobile, /justify-self:\s*end/, 'mobile has no right-align rule');
  assert.doesNotMatch(mobile, /320px/, 'mobile does not force 320px image size');
}

{
  assert.match(css, /max-width:\s*1040px/, 'M15 width intact');
  assert.match(css, /margin-inline:\s*auto/, 'M15 centering intact');
  assert.match(css, /"Open Sans",\s*Arial,\s*sans-serif/, 'M15 Open Sans intact');
  assert.match(css, /#235853/, 'M15 PHC Green intact');
  assert.match(css, /#e76827/, 'M15 Tango intact');
  assert.match(css, /#b7dbd1/, 'M15 Edgewater intact');
  assert.match(
    css,
    /\.phc-directory__results\s*\{[^}]*Georgia,\s*'Times New Roman',\s*serif/s,
    'editorial serif intact',
  );
}

console.log('All Milestone 16 desktop card composition tests passed.');
