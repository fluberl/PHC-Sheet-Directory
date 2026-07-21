/**
 * Bootstrap — Version 1.0 (Milestone 7)
 * Composes the application and starts it exactly once.
 * Orchestrates lifecycle; contains no transport, validation, transform,
 * Catalog, or Search implementation bodies.
 */

import { getConfig } from './config/config.js';
import { getMountRoot } from './host/mount.js';
import { createState } from './state/state.js';
import { report } from './errors/errors.js';
import { fetchPublic } from './data/source.js';
import { getDirectorySchema } from './schema/contract.js';
import {
  validatePublicRows,
  summarizeValidationErrors,
} from './schema/validate.js';
import { transformRowsToEntries } from './domain/transform.js';
import { createCatalog } from './catalog/catalog.js';
import { searchCatalog } from './search/search.js';
import { bind } from './interaction/interaction.js';
import { render } from './render/render.js';

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
  const schema = getDirectorySchema();
  const validation = validatePublicRows(rows, schema);

  if (!validation.valid) {
    state.setSchemaError({
      rows,
      validationResult: validation,
      message: summarizeValidationErrors(validation),
    });
    return;
  }

  let entries;

  try {
    entries = transformRowsToEntries(rows);
  } catch (failure) {
    const message =
      failure instanceof Error && failure.message
        ? failure.message
        : 'Directory transformation failed.';

    state.setTransformError({
      rows,
      validationResult: validation,
      message,
    });
    return;
  }

  let catalog;

  try {
    catalog = createCatalog(entries);
  } catch (failure) {
    const message =
      failure instanceof Error && failure.message
        ? failure.message
        : 'Catalog creation failed.';

    state.setCatalogError({
      rows,
      validationResult: validation,
      entries,
      message,
    });
    return;
  }

  const searchText = '';
  const searchResult = searchCatalog(catalog, { text: searchText });

  if (catalog.size === 0) {
    state.setEmpty({
      rows,
      validationResult: validation,
      entries,
      catalog,
      searchResult,
      searchText,
    });
    return;
  }

  state.setReady({
    rows,
    validationResult: validation,
    entries,
    catalog,
    searchResult,
    searchText,
  });
}

/**
 * Start the directory application once.
 *
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
