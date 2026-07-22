/**
 * Milestone 13 tests — WordPress plugin host contract (static checks).
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = join(root, 'wordpress', 'phc-cpd-directory');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function listJs(dir) {
  /** @type {string[]} */
  const files = [];
  function walk(current) {
    for (const name of readdirSync(current)) {
      const full = join(current, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (name.endsWith('.js')) files.push(full);
    }
  }
  walk(dir);
  return files;
}

console.log('Running Milestone 13 WordPress integration tests…');

{
  assert(existsSync(join(pluginRoot, 'phc-cpd-directory.php')), 'plugin php');
  assert(
    existsSync(join(pluginRoot, 'assets/js/phc-cpd-directory.js')),
    'entry js',
  );
  assert(
    existsSync(join(pluginRoot, 'assets/css/phc-directory.css')),
    'plugin css',
  );
  assert(
    existsSync(join(pluginRoot, 'assets/js/src/bootstrap.js')),
    'synced bootstrap',
  );
  assert(
    existsSync(join(pluginRoot, 'assets/js/src/config/phc-public-cpd.js')),
    'synced sheets config',
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
  assert(php.includes('type="module"'), 'module script tag');
  assert(!/eval\s*\(/.test(php), 'no eval');
}

{
  const entry = readFileSync(
    join(pluginRoot, 'assets/js/phc-cpd-directory.js'),
    'utf8',
  );
  assert(/from '\.\/src\/bootstrap\.js'/.test(entry), 'imports bootstrap');
  assert(/start\(\)/.test(entry), 'calls start');
  assert(!/docs\.google\.com/.test(entry), 'no sheets url in entry');
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
  const synced = listJs(join(pluginRoot, 'assets/js/src'));
  assert(synced.length >= 30, 'src tree synced');
  for (const file of synced) {
    const rel = relative(join(pluginRoot, 'assets/js/src'), file);
    assert(existsSync(join(root, 'src', rel)), `mirror exists for ${rel}`);
  }
}

console.log('All Milestone 13 WordPress integration tests passed.');
