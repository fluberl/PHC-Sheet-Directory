/**
 * WordPress host entry — Milestone 13
 * Loads only when the plugin enqueues this module on a page with the shortcode.
 * Uses the application default PUBLIC datasource (no WordPress-side URL).
 */

import { start } from './src/bootstrap.js';

start();
