/**
 * Rendering — Version 1.0 (Milestone 2)
 * Projects Application State into the mount root only.
 * Layout of future result cards is not decided here.
 */

import { createLifecycleView } from './states.js';

/**
 * @param {Element} root
 * @param {{ lifecycle: string, errorMessage: string | null }} snapshot
 */
export function render(root, snapshot) {
  root.replaceChildren();

  const app = document.createElement('div');
  app.className = 'phc-directory';
  app.appendChild(createLifecycleView(snapshot));

  root.appendChild(app);
}
