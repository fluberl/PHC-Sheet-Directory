/**
 * Sync deployable WordPress plugin assets from the application tree.
 * Copies CSS + src/ into wordpress/phc-cpd-directory/assets/ so the plugin
 * zip is self-contained. Does not modify application behaviour.
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

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = join(root, 'wordpress', 'phc-cpd-directory');
const cssSource = join(root, 'assets', 'styles', 'phc-directory.css');
const srcSource = join(root, 'src');
const cssTargetDir = join(pluginRoot, 'assets', 'css');
const cssTarget = join(cssTargetDir, 'phc-directory.css');
const jsSrcTarget = join(pluginRoot, 'assets', 'js', 'src');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(existsSync(pluginRoot), 'Plugin directory missing');
assert(existsSync(cssSource), 'Application CSS missing');
assert(existsSync(srcSource), 'Application src/ missing');

mkdirSync(cssTargetDir, { recursive: true });
cpSync(cssSource, cssTarget);

if (existsSync(jsSrcTarget)) {
  rmSync(jsSrcTarget, { recursive: true, force: true });
}
cpSync(srcSource, jsSrcTarget, { recursive: true });

const stamp = {
  deployedAt: new Date().toISOString(),
  css: 'assets/css/phc-directory.css',
  src: 'assets/js/src',
};
writeFileSync(
  join(pluginRoot, 'assets', 'DEPLOYED.json'),
  `${JSON.stringify(stamp, null, 2)}\n`,
);

console.log('WordPress plugin assets deployed:');
console.log(`  ${cssTarget}`);
console.log(`  ${jsSrcTarget}`);
