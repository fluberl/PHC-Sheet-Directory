/**
 * Structural Validation — Version 1.0 (Milestone 4)
 * Checks acquired PUBLIC rows against the Schema Contract.
 *
 * Structural only — not business or editorial validation.
 * Collects every error; does not stop at the first failure.
 *
 * Row numbering convention (Approach A):
 * - ValidationError.row is the zero-based array index.
 * - User-facing messages and summaries use a one-based row number (index + 1).
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
 * @param {number} zeroBasedIndex
 * @returns {number}
 */
function toDisplayRow(zeroBasedIndex) {
  return zeroBasedIndex + 1;
}

/**
 * @param {unknown[]} rows
 * @param {{ fields: readonly { name: string, type: string, required: boolean }[] }} schema
 * @returns {ValidationResult}
 */
export function validatePublicRows(rows, schema) {
  /** @type {ValidationError[]} */
  const errors = [];

  /** @type {Map<string, number>} */
  const seenIds = new Map();

  rows.forEach((row, index) => {
    const displayRow = toDisplayRow(index);

    if (!isPlainObject(row)) {
      errors.push({
        row: index,
        field: '',
        code: 'not_object',
        message: `Row ${displayRow} must be an object.`,
      });
      return;
    }

    schema.fields.forEach((field) => {
      if (!field.required) {
        return;
      }

      if (!Object.prototype.hasOwnProperty.call(row, field.name)) {
        errors.push({
          row: index,
          field: field.name,
          code: 'missing_field',
          message: `Row ${displayRow} is missing required field "${field.name}".`,
        });
        return;
      }

      const value = row[field.name];

      if (value === null || value === undefined) {
        errors.push({
          row: index,
          field: field.name,
          code: 'missing_field',
          message: `Row ${displayRow} required field "${field.name}" must not be null or undefined.`,
        });
        return;
      }

      if (typeof value !== field.type) {
        errors.push({
          row: index,
          field: field.name,
          code: 'invalid_type',
          message: `Row ${displayRow} field "${field.name}" must be of type ${field.type} (received ${typeof value}).`,
        });
      }
    });

    if (
      Object.prototype.hasOwnProperty.call(row, 'id') &&
      typeof row.id === 'string'
    ) {
      const previous = seenIds.get(row.id);
      if (previous !== undefined) {
        errors.push({
          row: index,
          field: 'id',
          code: 'duplicate_id',
          message: `Row ${displayRow} duplicates id "${row.id}" from row ${toDisplayRow(previous)}.`,
        });
      } else {
        seenIds.set(row.id, index);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Human-readable summary for Application State errorMessage.
 * Does not expose the full Validation Result to Rendering.
 * Uses one-based row numbers already present in error messages.
 *
 * @param {ValidationResult} result
 * @returns {string}
 */
export function summarizeValidationErrors(result) {
  const count = result.errors.length;
  if (count === 0) {
    return 'PUBLIC schema validation failed.';
  }

  const first = result.errors[0];
  const suffix = count === 1 ? '' : ` (+${count - 1} more)`;
  return `PUBLIC schema validation failed: ${first.message}${suffix}`;
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
