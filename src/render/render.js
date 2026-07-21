/**
 * Rendering — Version 1.0 (Milestone 1)
 * Projects a static loading state into the mount root only.
 */

/**
 * @param {Element} root
 */
export function renderLoading(root) {
  root.replaceChildren();

  const status = document.createElement('p');
  status.className = 'phc-directory__status';
  status.setAttribute('role', 'status');
  status.textContent = 'Loading…';

  root.appendChild(status);
}
