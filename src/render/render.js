/**
 * Rendering — Version 1.0 (Milestone 7)
 * Projects Application State into the mount root only.
 * Receives only the immutable snapshot — never Catalog or SearchResult.
 */

import { createLifecycleView } from './states.js';

/**
 * @param {Element} root
 * @param {{
 *   lifecycle: string,
 *   errorMessage: string | null,
 *   rowCount: number | null,
 *   resultCount: number | null,
 *   searchText: string,
 * }} snapshot
 */
export function render(root, snapshot) {
  root.replaceChildren();

  const app = document.createElement('div');
  app.className = 'phc-directory';
  app.appendChild(createLifecycleView(snapshot));

  root.appendChild(app);
}
