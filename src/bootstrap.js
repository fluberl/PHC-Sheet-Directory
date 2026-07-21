/**
 * Bootstrap — Version 1.0 (Milestone 4)
 * Composes the application and starts it exactly once.
 * Hosts decide when to call start() and supply host-specific config
 * (for example publicSource).
 * Orchestrates lifecycle; contains no transport or validation logic bodies.
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

  if (rows.length === 0) {
    state.setEmpty(rows, validation);
    return;
  }

  state.setReady({
    rows,
    validationResult: validation,
  });
}

/**
 * Start the directory application once.
 * Modifies only the mount-root subtree when the host contract is satisfied.
 *
 * @param {{ mountSelector?: string, publicSource?: string }} [hostOptions]
 *        Host-supplied overrides. Demo / WordPress provide publicSource.
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

  loadPublic(config, state).catch((failure) => {
    report(failure, state);
  });
}
