/**
 * Lifecycle state views — Version 1.0 (Milestone 3)
 * Builds semantic markup for loading / empty / ready / error.
 * Does not decide layout for future result cards.
 */

/**
 * @param {{
 *   lifecycle: string,
 *   errorMessage: string | null,
 *   rowCount: number | null,
 * }} snapshot
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

  if (snapshot.lifecycle === 'ready') {
    const status = document.createElement('div');
    status.className = 'phc-directory__status phc-directory__status--ready';
    status.setAttribute('role', 'status');

    const title = document.createElement('p');
    title.className = 'phc-directory__status-title';
    title.textContent = 'Directory entries ready';

    const count = document.createElement('p');
    count.className = 'phc-directory__status-detail';
    const rowCount = snapshot.rowCount == null ? 0 : snapshot.rowCount;
    count.textContent = `Number of entries: ${rowCount}`;

    status.appendChild(title);
    status.appendChild(count);
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
