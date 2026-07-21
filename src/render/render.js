/**
 * Rendering — Version 1.0 (Milestone 3)
 * Projects Application State into the mount root only.
 * Knows nothing about PUBLIC structure beyond the state snapshot.
 */

import { createLifecycleView } from './states.js';

/**
 * @param {Element} root
 * @param {{
 *   lifecycle: string,
 *   errorMessage: string | null,
 *   rowCount: number | null,
 * }} snapshot
 */
export function render(root, snapshot) {
  root.replaceChildren();

  const app = document.createElement('div');
  app.className = 'phc-directory';
  app.appendChild(createLifecycleView(snapshot));

  root.appendChild(app);
}
