/**
 * Bootstrap — Version 1.0 (Milestone 8)
 * Orchestrates PUBLIC acquisition → CPD mapping → Catalog → Search → State.
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
  cpdRecordAccessors,
  mapPublicRowsToCpdCourses,
} from './specializations/cpd/index.js';

let hasStarted = false;

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
  const searchResult = searchCatalog(
    catalog,
    { text: searchText },
    cpdRecordAccessors,
  );

  if (catalog.size === 0) {
    state.setEmpty({
      validationResult: transport,
      entries: courses,
      catalog,
      searchResult,
      searchText,
      recordAccessors: cpdRecordAccessors,
    });
    return;
  }

  state.setReady({
    validationResult: transport,
    entries: courses,
    catalog,
    searchResult,
    searchText,
    recordAccessors: cpdRecordAccessors,
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
    render(mount.root, snapshot);
  };

  state.subscribe(renderSnapshot);
  renderSnapshot(state.getSnapshot());

  bind(mount.root, {
    onSearchInput(value) {
      state.setSearchText(value);
    },
  });

  loadPublic(config, state).catch((failure) => {
    report(failure, state);
  });
}
