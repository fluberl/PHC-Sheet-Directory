/**
 * Error Handling — Version 1.0 (Milestone 2)
 * Normalizes failures into Application State error outcomes.
 */

/**
 * @param {string | { message?: string }} failure
 * @param {{ setError: (message: string) => void }} stateApi
 */
export function report(failure, stateApi) {
  let message = 'Beim Laden des Verzeichnisses ist etwas schiefgelaufen.';

  if (typeof failure === 'string' && failure.trim() !== '') {
    message = failure.trim();
  } else if (
    failure &&
    typeof failure === 'object' &&
    typeof failure.message === 'string' &&
    failure.message.trim() !== ''
  ) {
    message = failure.message.trim();
  }

  stateApi.setError(message);
}
