/**
 * Transport-level row validation — Version 1.0 (Milestone 8)
 * Ensures PUBLIC payload is an array of plain objects.
 * Field-level domain validation belongs to specialization mappers/constructors.
 */

/**
 * @typedef {{
 *   row: number,
 *   field: string,
 *   code: string,
 *   message: string,
 * }} ValidationError
 *
 * @typedef {{
 *   valid: boolean,
 *   errors: ValidationError[],
 * }} ValidationResult
 */

/**
 * @param {unknown} rows
 * @returns {ValidationResult}
 */
export function validateTransportRows(rows) {
  /** @type {ValidationError[]} */
  const errors = [];

  if (!Array.isArray(rows)) {
    return {
      valid: false,
      errors: [
        {
          row: 0,
          field: '',
          code: 'not_array',
          message: 'PUBLIC payload must be a JSON array.',
        },
      ],
    };
  }

  rows.forEach((row, index) => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      errors.push({
        row: index,
        field: '',
        code: 'not_object',
        message: `Row ${index + 1} must be an object.`,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
