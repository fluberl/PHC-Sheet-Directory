/**
 * Bootstrap — Version 1.0 (Milestone 1)
 * Composes the application and starts it exactly once.
 */

import { getConfig } from './config/config.js';
import { getMountRoot } from './host/mount.js';
import { renderLoading } from './render/render.js';

let hasStarted = false;

/**
 * Start the directory application once.
 * Modifies only the mount-root subtree when the host contract is satisfied.
 */
export function start() {
  if (hasStarted) {
    return;
  }
  hasStarted = true;

  const config = getConfig();
  const mount = getMountRoot(config.mountSelector);

  if (!mount.ok) {
    console.error(mount.message);
    return;
  }

  renderLoading(mount.root);
}
