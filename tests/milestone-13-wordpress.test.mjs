/**
 * Milestone 13 tests — WordPress plugin host contract (static checks).
 * Updated for Milestone 14.1 production IIFE bundle enqueue.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertProductionBundle } from '../scripts/assert-production-bundle.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = join(root, 'wordpress', 'phc-cpd-directory');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('Running Milestone 13 WordPress integration tests…');

{
  assert(existsSync(join(pluginRoot, 'phc-cpd-directory.php')), 'plugin php');
  assert(
    existsSync(join(root, 'scripts/wordpress-bundle-entry.js')),
    'bundle entry source',
  );
  assert(
    existsSync(join(pluginRoot, 'assets/js/phc-cpd-directory.bundle.js')),
    'production bundle',
  );
  assert(
    existsSync(join(pluginRoot, 'assets/css/phc-directory.css')),
    'plugin css',
  );
  assert(
    !existsSync(join(pluginRoot, 'assets/js/src')),
    'nested ESM src must not ship in plugin',
  );
  assert(
    !existsSync(join(pluginRoot, 'assets/js/phc-cpd-directory.js')),
    'modular entry must not ship in plugin',
  );
}

{
  const php = readFileSync(join(pluginRoot, 'phc-cpd-directory.php'), 'utf8');
  assert(php.includes('phc_cpd_directory'), 'shortcode name');
  assert(php.includes('phc-cpd-directory'), 'mount id');
  assert(
    /return\s+'<div id="phc-cpd-directory"><\/div>';/.test(php) ||
      /return\s+"<div id=\\"phc-cpd-directory\\"><\/div>";/.test(php),
    'exact mount markup',
  );
  assert(!/docs\.google\.com/.test(php), 'no sheets url in php');
  assert(php.includes('wp_enqueue_style'), 'style enqueue');
  assert(php.includes('wp_enqueue_script'), 'script enqueue');
  assert(php.includes('filemtime'), 'cache busting');
  assert(
    php.includes('phc-cpd-directory.bundle.js'),
    'enqueues production bundle',
  );
  assert(
    !php.includes("assets/js/phc-cpd-directory.js'"),
    'does not enqueue modular entry',
  );
  assert(!php.includes('type="module"'), 'classic script, not ESM module tag');
  assert(!php.includes('module_script_tag'), 'no module tag filter');
  assert(!/eval\s*\(/.test(php), 'no eval');
  assert(php.includes("VERSION = '1.0.9'"), 'version constant 1.0.9');
  assert(php.includes('Version:           1.0.9'), 'plugin header 1.0.9');
}

{
  const entry = readFileSync(
    join(root, 'scripts/wordpress-bundle-entry.js'),
    'utf8',
  );
  assert(/from ['"].*src\/bootstrap\.js['"]/.test(entry), 'entry imports bootstrap');
  assert(/start\(\)/.test(entry), 'calls start');
  assert(!/docs\.google\.com/.test(entry), 'no sheets url in entry');
}

{
  const bundle = readFileSync(
    join(pluginRoot, 'assets/js/phc-cpd-directory.bundle.js'),
    'utf8',
  );
  assertProductionBundle(bundle, assert);
}

{
  const css = readFileSync(
    join(pluginRoot, 'assets/css/phc-directory.css'),
    'utf8',
  );
  assert(css.includes('#phc-cpd-directory'), 'scoped css');
  assert(
    !/(^|\n)\s*(body|html)\s*\{/.test(css),
    'no body/html rules',
  );
  assert(
    !/(^|\n)\s*a\s*\{/.test(css),
    'no unscoped anchor rules',
  );
}

{
  const appCss = readFileSync(
    join(root, 'assets/styles/phc-directory.css'),
    'utf8',
  );
  const pluginCss = readFileSync(
    join(pluginRoot, 'assets/css/phc-directory.css'),
    'utf8',
  );
  assert(appCss === pluginCss, 'plugin css matches application css');
}

{
  const bootstrap = readFileSync(join(root, 'src/bootstrap.js'), 'utf8');
  assert(
    /if\s*\(\s*!mount\.ok\s*\)\s*\{\s*return;\s*\}/.test(bootstrap),
    'missing mount returns silently',
  );
  assert(
    !/if\s*\(\s*!mount\.ok\s*\)\s*\{\s*console\.error/.test(bootstrap),
    'missing mount does not console.error',
  );
}

{
  const readme = readFileSync(join(pluginRoot, 'readme.txt'), 'utf8');
  assert(readme.includes('Stable tag: 1.0.9'), 'readme stable tag');
}

console.log('All Milestone 13 WordPress integration tests passed.');
