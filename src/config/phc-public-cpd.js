/**
 * PHC Public CPD datasource configuration — Milestone 12
 * Hosts may override via start({ publicSource }).
 */

/** Published Google Sheets CSV for PHC_Public_CPD (single source of truth). */
export const PHC_PUBLIC_CPD_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRBPgalMWq6fNZXfT-FhP-U-ais1GIT2Cx6gtUOX4eWlaaaZCioon8YoeNQDnxhtsCeQpDpO5PRoCWD/pub?gid=0&single=true&output=csv';

/**
 * @returns {string}
 */
export function getPhcPublicCpdSource() {
  return PHC_PUBLIC_CPD_CSV_URL;
}
