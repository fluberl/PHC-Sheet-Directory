/**
 * Lifecycle / diagnostic views — Version 1.0 (Milestone 8)
 * Shows search + id/title result projection. No course cards.
 */

/**
 * @param {{
 *   lifecycle: string,
 *   errorMessage: string | null,
 *   rowCount: number | null,
 *   resultCount: number | null,
 *   searchText: string,
 *   results?: readonly { id: string, title: string }[],
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
    const status = document.createElement('div');
    status.className = 'phc-directory__status phc-directory__status--empty';
    status.setAttribute('role', 'status');

    const message = document.createElement('p');
    message.className = 'phc-directory__status-title';
    message.textContent = 'No entries are available.';
    status.appendChild(message);
    status.appendChild(createDiagnostics(snapshot));
    region.appendChild(status);
    return region;
  }

  if (snapshot.lifecycle === 'ready') {
    const status = document.createElement('div');
    status.className = 'phc-directory__status phc-directory__status--ready';

    const title = document.createElement('p');
    title.className = 'phc-directory__status-title';
    title.setAttribute('role', 'status');
    title.textContent = 'Directory ready';
    status.appendChild(title);

    status.appendChild(createSearchControls(snapshot));
    status.appendChild(createDiagnostics(snapshot));
    status.appendChild(createResultList(snapshot));
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

/**
 * @param {{ searchText: string }} snapshot
 * @returns {HTMLElement}
 */
function createSearchControls(snapshot) {
  const controls = document.createElement('div');
  controls.className = 'phc-directory__search';

  const label = document.createElement('label');
  label.className = 'phc-directory__search-label';
  label.setAttribute('for', 'phc-directory-search');
  label.textContent = 'Search';

  const input = document.createElement('input');
  input.id = 'phc-directory-search';
  input.className = 'phc-directory__search-input';
  input.type = 'search';
  input.setAttribute('data-phc-search', '');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
  input.value = snapshot.searchText ?? '';
  input.setAttribute('aria-label', 'Search directory titles');

  controls.appendChild(label);
  controls.appendChild(input);
  return controls;
}

/**
 * @param {{
 *   rowCount: number | null,
 *   resultCount: number | null,
 *   searchText: string,
 * }} snapshot
 * @returns {HTMLElement}
 */
function createDiagnostics(snapshot) {
  const diagnostics = document.createElement('div');
  diagnostics.className = 'phc-directory__diagnostics';

  const loaded = document.createElement('p');
  loaded.className = 'phc-directory__status-detail';
  loaded.textContent = `Loaded (Catalog): ${snapshot.rowCount == null ? 0 : snapshot.rowCount}`;

  const results = document.createElement('p');
  results.className = 'phc-directory__status-detail';
  results.textContent = `Results: ${snapshot.resultCount == null ? 0 : snapshot.resultCount}`;

  const text = document.createElement('p');
  text.className = 'phc-directory__status-detail';
  text.textContent = `Search text: "${snapshot.searchText ?? ''}"`;

  diagnostics.appendChild(loaded);
  diagnostics.appendChild(results);
  diagnostics.appendChild(text);
  return diagnostics;
}

/**
 * Snapshot projection list — id/title only. Not visual course cards.
 *
 * @param {{ results?: readonly { id: string, title: string }[] }} snapshot
 * @returns {HTMLElement}
 */
function createResultList(snapshot) {
  const list = document.createElement('ul');
  list.className = 'phc-directory__result-list';

  const results = Array.isArray(snapshot.results) ? snapshot.results : [];

  results.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'phc-directory__result-item';

    const id = document.createElement('span');
    id.className = 'phc-directory__result-id';
    id.textContent = item.id;

    const title = document.createElement('span');
    title.className = 'phc-directory__result-title';
    title.textContent = item.title;

    li.appendChild(id);
    li.appendChild(document.createTextNode(' — '));
    li.appendChild(title);
    list.appendChild(li);
  });

  return list;
}
