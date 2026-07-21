/**
 * Bootstrap — Version 1.0 (Milestone 2)
 * Composes the application and starts it exactly once.
 * Hosts decide when to call start().
 *
 * Milestone 2 temporarily drives a demonstration lifecycle outcome here.
 * Milestone 3 will replace this with real PUBLIC loading.
 */

import { getConfig } from './config/config.js';
import { getMountRoot } from './host/mount.js';
import { createState } from './state/state.js';
import { report } from './errors/errors.js';
import { render } from './render/render.js';

let hasStarted = false;

/**
 * Temporary Milestone 2 demonstration control.
 * Change to 'loading' | 'empty' | 'error' for manual verification.
 * Remove when PUBLIC loading is introduced.
 * @type {'loading' | 'empty' | 'error'}
 */
const MILESTONE_2_DEMO_OUTCOME = 'empty';

/**
 * Apply Milestone 2 controlled demonstration outcomes (no PUBLIC data).
 * @param {'loading' | 'empty' | 'error'} outcome
 * @param {ReturnType<typeof createState>} state
 */
function applyDemoOutcome(outcome, state) {
  if (outcome === 'empty') {
    state.setEmpty();
    return;
  }

  if (outcome === 'error') {
    report(
      { message: 'Stub failure for Milestone 2 (no PUBLIC data loaded).' },
      state,
    );
    return;
  }

  // 'loading' — remain in the initial loading lifecycle
}

/**
 * Start the directory application once.
 * Modifies only the mount-root subtree when the host contract is satisfied.
 */
export function start() {
  if (hasStarted) {
    return;
  }
  hasStarted = true;

  const config = getConfig();
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
  applyDemoOutcome(MILESTONE_2_DEMO_OUTCOME, state);
}
