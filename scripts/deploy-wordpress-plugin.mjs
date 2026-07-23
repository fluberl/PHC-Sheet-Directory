/**
 * Sync deployable WordPress plugin assets from the application tree.
 * Copies CSS, builds the production JS bundle, and removes nested runtime
 * ESM modules from the plugin so only the bundle can be fetched.
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = join(root, 'wordpress', 'phc-cpd-directory');
const cssSource = join(root, 'assets', 'styles', 'phc-directory.css');
const cssTargetDir = join(pluginRoot, 'assets', 'css');
const cssTarget = join(cssTargetDir, 'phc-directory.css');
const jsSrcTarget = join(pluginRoot, 'assets', 'js', 'src');
const buildScript = join(root, 'scripts', 'build-wordpress-bundle.mjs');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(existsSync(pluginRoot), 'Plugin directory missing');
assert(existsSync(cssSource), 'Application CSS missing');
assert(existsSync(buildScript), 'Bundle build script missing');

mkdirSync(cssTargetDir, { recursive: true });
cpSync(cssSource, cssTarget);

// Nested ESM under the plugin must not be served at runtime.
if (existsSync(jsSrcTarget)) {
  rmSync(jsSrcTarget, { recursive: true, force: true });
}

const build = spawnSync(process.execPath, [buildScript], {
  cwd: root,
  encoding: 'utf8',
  stdio: 'inherit',
});
assert(build.status === 0, 'WordPress bundle build failed');

const stamp = {
  deployedAt: new Date().toISOString(),
  pluginVersion: '1.0.5',
  css: 'assets/css/phc-directory.css',
  bundle: 'assets/js/phc-cpd-directory.bundle.js',
  note: 'Production enqueues only the IIFE bundle; nested ESM is not shipped.',
};
writeFileSync(
  join(pluginRoot, 'assets', 'DEPLOYED.json'),
  `${JSON.stringify(stamp, null, 2)}\n`,
);

console.log('WordPress plugin assets deployed:');
console.log(`  ${cssTarget}`);
console.log(`  ${join(pluginRoot, 'assets/js/phc-cpd-directory.bundle.js')}`);
