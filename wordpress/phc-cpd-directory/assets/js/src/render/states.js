/**
 * Lifecycle views — Version 1.0 (Milestone 11)
 * Generic shell for lifecycle, discovery controls, view mode, and optional results.
 * Does not import CPD specialization. Copy, category options, and view options are injectable.
 */

/**
 * @typedef {{
 *   loading: string,
 *   empty: string,
 *   searchLabel: string,
 *   categoryLabel: string,
 *   allCategoriesLabel: string,
 *   viewLabel: string,
 *   resultStatusNone: string,
 *   resultStatusOne: string,
 *   resultStatusMany: (count: number) => string,
 *   noResults: string,
 *   errorFallback: string,
 * }} DirectoryCopy
 *
 * @typedef {{
 *   id: string,
 *   label: string,
 * }} CategoryOption
 *
 * @typedef {{
 *   id: string,
 *   label: string,
 * }} ViewModeOption
 *
 * @typedef {{
 *   lifecycle: string,
 *   errorMessage: string | null,
 *   rowCount: number | null,
 *   resultCount: number | null,
 *   searchText: string,
 *   categoryId?: string,
 *   viewMode?: string,
 *   results?: readonly unknown[],
 * }} LifecycleSnapshot
 *
 * @typedef {{
 *   copy?: Partial<DirectoryCopy>,
 *   categoryOptions?: readonly CategoryOption[],
 *   viewModeOptions?: readonly ViewModeOption[],
 *   renderResults?: (snapshot: LifecycleSnapshot) => HTMLElement | null,
 * }} LifecycleViewOptions
 */

/** @type {Readonly<DirectoryCopy>} */
export const defaultDirectoryCopy = Object.freeze({
  loading: 'Wird geladen…',
  empty: 'Keine Einträge verfügbar.',
  searchLabel: 'Suche',
  categoryLabel: 'Kategorie',
  allCategoriesLabel: 'Alle Kategorien',
  viewLabel: 'Ansicht',
  resultStatusNone: 'Keine passenden Ergebnisse',
  resultStatusOne: '1 Ergebnis',
  resultStatusMany(count) {
    return `${count} Ergebnisse`;
  },
  noResults:
    'Keine Ergebnisse entsprechen Ihrer aktuellen Suche und Kategorie. Versuchen Sie einen anderen Suchbegriff, wählen Sie eine andere Kategorie oder setzen Sie die Filter zurück.',
  errorFallback: 'Beim Laden des Verzeichnisses ist etwas schiefgelaufen.',
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

    status.appendChild(
      createDiscoveryControls(
        snapshot,
        copy,
        options.categoryOptions ?? [],
        options.viewModeOptions ?? [],
      ),
    );
    status.appendChild(createResultStatus(snapshot, copy));

    const resultCount =
      snapshot.resultCount == null ? 0 : snapshot.resultCount;

    if (resultCount === 0) {
      status.appendChild(createNoResultsMessage(copy));
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
 * @param {LifecycleSnapshot} snapshot
 * @param {DirectoryCopy} copy
 * @param {readonly CategoryOption[]} categoryOptions
 * @param {readonly ViewModeOption[]} viewModeOptions
 * @returns {HTMLElement}
 */
function createDiscoveryControls(
  snapshot,
  copy,
  categoryOptions,
  viewModeOptions,
) {
  const controls = document.createElement('div');
  controls.className = 'phc-directory__discovery';

  const search = document.createElement('div');
  search.className = 'phc-directory__search';

  const searchLabel = document.createElement('label');
  searchLabel.className = 'phc-directory__search-label';
  searchLabel.setAttribute('for', 'phc-directory-search');
  searchLabel.textContent = copy.searchLabel;

  const input = document.createElement('input');
  input.id = 'phc-directory-search';
  input.className = 'phc-directory__search-input';
  input.type = 'search';
  input.setAttribute('data-phc-search', '');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('aria-controls', 'phc-directory-result-status');
  input.value = snapshot.searchText ?? '';

  search.appendChild(searchLabel);
  search.appendChild(input);
  controls.appendChild(search);

  if (categoryOptions.length > 0) {
    const category = document.createElement('div');
    category.className = 'phc-directory__category';

    const categoryLabel = document.createElement('label');
    categoryLabel.className = 'phc-directory__category-label';
    categoryLabel.setAttribute('for', 'phc-directory-category');
    categoryLabel.textContent = copy.categoryLabel;

    const select = document.createElement('select');
    select.id = 'phc-directory-category';
    select.className = 'phc-directory__category-select';
    select.setAttribute('data-phc-category', '');
    select.setAttribute('aria-controls', 'phc-directory-result-status');

    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = copy.allCategoriesLabel;
    select.appendChild(allOption);

    const selected = snapshot.categoryId ?? '';
    categoryOptions.forEach((option) => {
      const node = document.createElement('option');
      node.value = option.id;
      node.textContent = option.label;
      if (option.id === selected) {
        node.selected = true;
      }
      select.appendChild(node);
    });

    if (selected === '') {
      allOption.selected = true;
    }

    category.appendChild(categoryLabel);
    category.appendChild(select);
    controls.appendChild(category);
  }

  if (viewModeOptions.length > 0) {
    const view = document.createElement('div');
    view.className = 'phc-directory__view';

    const viewLabel = document.createElement('label');
    viewLabel.className = 'phc-directory__view-label';
    viewLabel.setAttribute('for', 'phc-directory-view');
    viewLabel.textContent = copy.viewLabel;

    const select = document.createElement('select');
    select.id = 'phc-directory-view';
    select.className = 'phc-directory__view-select';
    select.setAttribute('data-phc-view', '');
    select.setAttribute('aria-controls', 'phc-directory-results-heading');

    const selected = snapshot.viewMode ?? '';
    let matched = false;
    viewModeOptions.forEach((option) => {
      const node = document.createElement('option');
      node.value = option.id;
      node.textContent = option.label;
      if (option.id === selected) {
        node.selected = true;
        matched = true;
      }
      select.appendChild(node);
    });

    if (!matched && select.options.length > 0) {
      select.options[0].selected = true;
    }

    view.appendChild(viewLabel);
    view.appendChild(select);
    controls.appendChild(view);
  }

  return controls;
}

/**
 * @param {{
 *   rowCount: number | null,
 *   resultCount: number | null,
 *   searchText: string,
 *   categoryId?: string,
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
  const categoryId = snapshot.categoryId ?? '';
  const filtersActive = searchText !== '' || categoryId !== '';

  if (resultCount === 0 && rowCount > 0 && filtersActive) {
    status.textContent = copy.resultStatusNone;
  } else if (resultCount === 1) {
    status.textContent = copy.resultStatusOne;
  } else {
    status.textContent = copy.resultStatusMany(resultCount);
  }

  return status;
}

/**
 * @param {DirectoryCopy} copy
 * @returns {HTMLElement}
 */
function createNoResultsMessage(copy) {
  const message = document.createElement('div');
  message.className = 'phc-directory__no-results';
  message.setAttribute('role', 'status');

  const paragraph = document.createElement('p');
  paragraph.className = 'phc-directory__no-results-text';
  paragraph.textContent = copy.noResults;

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
