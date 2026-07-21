/**
 * Lifecycle state views — Version 1.0 (Milestone 2)
 * Builds semantic markup for loading / empty / error.
 * Does not decide layout for future result cards.
 */

/**
 * @param {{ lifecycle: string, errorMessage: string | null }} snapshot
 * @returns {HTMLElement}
 */
export function createLifecycleView(snapshot) {
  const region = document.createElement('div');
  region.className = 'phc-directory__lifecycle';

  if (snapshot.lifecycle === 'loading') {
    const status = document.createElement('p');
    status.className = 'phc-directory__status phc-directory__status--loading';
    status.setAttribute('role', 'status');
    status.textContent = 'Loading…';
    region.appendChild(status);
    return region;
  }

  if (snapshot.lifecycle === 'empty') {
    const status = document.createElement('p');
    status.className = 'phc-directory__status phc-directory__status--empty';
    status.setAttribute('role', 'status');
    status.textContent = 'No entries are available.';
    region.appendChild(status);
    return region;
  }

  const status = document.createElement('p');
  status.className = 'phc-directory__status phc-directory__status--error';
  status.setAttribute('role', 'alert');
  status.textContent =
    snapshot.errorMessage || 'Something went wrong while loading the directory.';
  region.appendChild(status);
  return region;
}
