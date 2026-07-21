/**
 * Rendering — Version 1.0 (Milestone 8)
 * Snapshot-only. No Catalog, SearchResult, mapper, or acquisition imports.
 */

import { createLifecycleView } from './states.js';

/**
 * @param {Element} root
 * @param {object} snapshot
 */
export function render(root, snapshot) {
  root.replaceChildren();

  const app = document.createElement('div');
  app.className = 'phc-directory';
  app.appendChild(createLifecycleView(snapshot));

  root.appendChild(app);
}
