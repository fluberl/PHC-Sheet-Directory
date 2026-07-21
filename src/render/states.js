/**
 * Lifecycle views — Version 1.0 (Milestone 9)
 * Generic shell for lifecycle, search, and optional result rendering.
 * Does not import CPD specialization. Copy is injectable.
 */

/**
 * @typedef {{
 *   loading: string,
 *   empty: string,
 *   searchLabel: string,
 *   resultStatusNone: string,
 *   resultStatusOne: string,
 *   resultStatusMany: (count: number) => string,
 *   noResultsWithTerm: (term: string) => string,
 *   noResults: string,
 *   errorFallback: string,
 * }} DirectoryCopy
 *
 * @typedef {{
 *   lifecycle: string,
 *   errorMessage: string | null,
 *   rowCount: number | null,
 *   resultCount: number | null,
 *   searchText: string,
 *   results?: readonly unknown[],
 * }} LifecycleSnapshot
 *
 * @typedef {{
 *   copy?: Partial<DirectoryCopy>,
 *   renderResults?: (snapshot: LifecycleSnapshot) => HTMLElement | null,
 * }} LifecycleViewOptions
 */

/** @type {Readonly<DirectoryCopy>} */
export const defaultDirectoryCopy = Object.freeze({
  loading: 'Loading…',
  empty: 'No entries are available.',
  searchLabel: 'Search',
  resultStatusNone: 'No matching results',
  resultStatusOne: '1 result',
  resultStatusMany(count) {
    return `${count} results`;
  },
  noResultsWithTerm(term) {
    return `No results match “${term}”. Try another search term, or clear the search field.`;
  },
  noResults: 'No results match the current search.',
  errorFallback: 'Something went wrong while loading the directory.',
});

/**
 * @param {Partial<DirectoryCopy> | undefined} overrides
 * @returns {DirectoryCopy}
 */
function resolveCopy(overrides) {
  return {
    ...defaultDirectoryCopy,
    ...(overrides && typeof overrides === 'object' ? overrides : {}),
  };
}

/**
 * @param {LifecycleSnapshot} snapshot
 * @param {LifecycleViewOptions} [options]
 * @returns {HTMLElement}
 */
export function createLifecycleView(snapshot, options = {}) {
  const copy = resolveCopy(options.copy);
  const region = document.createElement('div');
  region.className = 'phc-directory__lifecycle';

  if (snapshot.lifecycle === 'loading') {
    const status = document.createElement('p');
    status.className = 'phc-directory__status phc-directory__status--loading';
    status.setAttribute('role', 'status');
    status.textContent = copy.loading;
    region.appendChild(status);
    return region;
  }

  if (snapshot.lifecycle === 'empty') {
    const status = document.createElement('div');
    status.className = 'phc-directory__status phc-directory__status--empty';
    status.setAttribute('role', 'status');

    const message = document.createElement('p');
    message.className = 'phc-directory__status-title';
    message.textContent = copy.empty;
    status.appendChild(message);
    region.appendChild(status);
    return region;
  }

  if (snapshot.lifecycle === 'ready') {
    const status = document.createElement('div');
    status.className = 'phc-directory__status phc-directory__status--ready';

    status.appendChild(createSearchControls(snapshot, copy));
    status.appendChild(createResultStatus(snapshot, copy));

    const resultCount =
      snapshot.resultCount == null ? 0 : snapshot.resultCount;

    if (resultCount === 0) {
      status.appendChild(createNoResultsMessage(snapshot, copy));
    } else if (typeof options.renderResults === 'function') {
      const resultsView = options.renderResults(snapshot);
      if (resultsView) {
        status.appendChild(resultsView);
      }
    } else {
      status.appendChild(createFallbackResultList(snapshot));
    }

    region.appendChild(status);
    return region;
  }

  const status = document.createElement('p');
  status.className = 'phc-directory__status phc-directory__status--error';
  status.setAttribute('role', 'alert');
  status.textContent = snapshot.errorMessage || copy.errorFallback;
  region.appendChild(status);
  return region;
}

/**
 * @param {{ searchText: string }} snapshot
 * @param {DirectoryCopy} copy
 * @returns {HTMLElement}
 */
function createSearchControls(snapshot, copy) {
  const controls = document.createElement('div');
  controls.className = 'phc-directory__search';

  const label = document.createElement('label');
  label.className = 'phc-directory__search-label';
  label.setAttribute('for', 'phc-directory-search');
  label.textContent = copy.searchLabel;

  const input = document.createElement('input');
  input.id = 'phc-directory-search';
  input.className = 'phc-directory__search-input';
  input.type = 'search';
  input.setAttribute('data-phc-search', '');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('aria-controls', 'phc-directory-result-status');
  input.value = snapshot.searchText ?? '';

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
 * @param {DirectoryCopy} copy
 * @returns {HTMLElement}
 */
function createResultStatus(snapshot, copy) {
  const status = document.createElement('p');
  status.id = 'phc-directory-result-status';
  status.className = 'phc-directory__result-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const resultCount = snapshot.resultCount == null ? 0 : snapshot.resultCount;
  const rowCount = snapshot.rowCount == null ? 0 : snapshot.rowCount;
  const searchText = snapshot.searchText ?? '';

  if (resultCount === 0 && rowCount > 0 && searchText !== '') {
    status.textContent = copy.resultStatusNone;
  } else if (resultCount === 1) {
    status.textContent = copy.resultStatusOne;
  } else {
    status.textContent = copy.resultStatusMany(resultCount);
  }

  return status;
}

/**
 * @param {{ searchText: string }} snapshot
 * @param {DirectoryCopy} copy
 * @returns {HTMLElement}
 */
function createNoResultsMessage(snapshot, copy) {
  const message = document.createElement('div');
  message.className = 'phc-directory__no-results';
  message.setAttribute('role', 'status');

  const paragraph = document.createElement('p');
  paragraph.className = 'phc-directory__no-results-text';

  const term = snapshot.searchText ?? '';
  paragraph.textContent =
    term !== '' ? copy.noResultsWithTerm(term) : copy.noResults;

  message.appendChild(paragraph);
  return message;
}

/**
 * Flat id/title fallback for non-CPD consumers.
 *
 * @param {{ results?: readonly unknown[] }} snapshot
 * @returns {HTMLElement}
 */
function createFallbackResultList(snapshot) {
  const list = document.createElement('ul');
  list.className = 'phc-directory__result-list';

  const results = Array.isArray(snapshot.results) ? snapshot.results : [];

  results.forEach((item) => {
    if (
      item === null ||
      typeof item !== 'object' ||
      typeof /** @type {{ id?: unknown }} */ (item).id !== 'string' ||
      typeof /** @type {{ title?: unknown }} */ (item).title !== 'string'
    ) {
      return;
    }

    const li = document.createElement('li');
    li.className = 'phc-directory__result-item';
    li.textContent = `${/** @type {{ id: string }} */ (item).id} — ${
      /** @type {{ title: string }} */ (item).title
    }`;
    list.appendChild(li);
  });

  return list;
}
