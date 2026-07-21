/**
 * Bootstrap — Version 1.0 (Milestone 11)
 * Orchestrates PUBLIC → CPD domain → Catalog → discovery → view rendering.
 */

import { getConfig } from './config/config.js';
import { getMountRoot } from './host/mount.js';
import { createState } from './state/state.js';
import { report } from './errors/errors.js';
import { fetchPublic } from './data/source.js';
import { validateTransportRows } from './schema/transport.js';
import { summarizeValidationErrors } from './schema/validate.js';
import { createCatalog } from './catalog/catalog.js';
import { searchCatalog } from './search/search.js';
import { bind } from './interaction/interaction.js';
import { render } from './render/render.js';
import {
  CPD_VIEW_MODE_OPTIONS,
  DEFAULT_CPD_VIEW_MODE,
  cpdRecordAccessors,
  createCpdResultsView,
  listPrimaryCategories,
  mapPublicRowsToCpdCourses,
  normalizeViewMode,
  projectCpdSearchResultToCards,
} from './specializations/cpd/index.js';
import { cpdDirectoryCopy } from './specializations/cpd/copy.js';

let hasStarted = false;

const categoryOptions = listPrimaryCategories().map((item) =>
  Object.freeze({ id: item.id, label: item.label }),
);

const viewModeOptions = CPD_VIEW_MODE_OPTIONS.map((item) =>
  Object.freeze({ id: item.id, label: item.label }),
);

/**
 * @param {{ mountSelector: string, publicSource?: string }} config
 * @param {ReturnType<typeof createState>} state
 */
async function loadPublic(config, state) {
  state.setLoading();

  const result = await fetchPublic(config);

  if (!result.ok) {
    report(result, state);
    return;
  }

  const rows = result.payload;
  const transport = validateTransportRows(rows);

  if (!transport.valid) {
    state.setSchemaError({
      rows: Array.isArray(rows) ? rows : [],
      validationResult: transport,
      message: summarizeValidationErrors(transport),
    });
    return;
  }

  let courses;

  try {
    courses = mapPublicRowsToCpdCourses(rows);
  } catch (failure) {
    const message =
      failure instanceof Error && failure.message
        ? failure.message
        : 'PUBLIC mapping failed.';

    state.setTransformError({
      rows,
      validationResult: transport,
      message,
    });
    return;
  }

  let catalog;

  try {
    catalog = createCatalog(courses, cpdRecordAccessors);
  } catch (failure) {
    const message =
      failure instanceof Error && failure.message
        ? failure.message
        : 'Catalog creation failed.';

    state.setCatalogError({
      entries: courses,
      validationResult: transport,
      message,
    });
    return;
  }

  const searchText = '';
  const categoryId = '';
  const viewMode = DEFAULT_CPD_VIEW_MODE;
  const searchResult = searchCatalog(
    catalog,
    { text: searchText, categoryId },
    cpdRecordAccessors,
  );

  const projectResults = (nextSearchResult) =>
    projectCpdSearchResultToCards(nextSearchResult);

  if (catalog.size === 0) {
    state.setEmpty({
      validationResult: transport,
      entries: courses,
      catalog,
      searchResult,
      searchText,
      categoryId,
      viewMode,
      recordAccessors: cpdRecordAccessors,
      projectResults,
    });
    return;
  }

  state.setReady({
    validationResult: transport,
    entries: courses,
    catalog,
    searchResult,
    searchText,
    categoryId,
    viewMode,
    recordAccessors: cpdRecordAccessors,
    projectResults,
  });
}

/**
 * @param {{ mountSelector?: string, publicSource?: string }} [hostOptions]
 */
export function start(hostOptions = {}) {
  if (hasStarted) {
    return;
  }
  hasStarted = true;

  const base = getConfig();
  const config = Object.freeze({
    mountSelector: hostOptions.mountSelector ?? base.mountSelector,
    publicSource: hostOptions.publicSource,
  });

  const mount = getMountRoot(config.mountSelector);

  if (!mount.ok) {
    console.error(mount.message);
    return;
  }

  const state = createState();

  const renderSnapshot = (snapshot) => {
    render(mount.root, snapshot, {
      copy: cpdDirectoryCopy,
      categoryOptions,
      viewModeOptions,
      renderResults(current) {
        const cards = Array.isArray(current.results) ? current.results : [];
        return createCpdResultsView(
          /** @type {import('./specializations/cpd/presentation.js').CpdCourseCardModel[]} */ (
            cards
          ),
          current.viewMode,
        );
      },
    });
  };

  state.subscribe(renderSnapshot);
  renderSnapshot(state.getSnapshot());

  bind(mount.root, {
    onSearchInput(value) {
      state.setSearchText(value);
    },
    onCategoryChange(value) {
      state.setCategoryId(value);
    },
    onViewModeChange(value) {
      state.setViewMode(normalizeViewMode(value));
    },
  });

  loadPublic(config, state).catch((failure) => {
    report(failure, state);
  });
}
