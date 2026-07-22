/**
 * Schema Contract — Version 1.0 (Milestone 4)
 * Minimal structural contract between PUBLIC data and the Directory Engine.
 *
 * Defines only: field name, required status, expected primitive type.
 * No search, filter, visibility, CPD, rendering, editorial, or business metadata.
 */

/**
 * @typedef {'string' | 'number' | 'boolean'} SchemaFieldType
 *
 * @typedef {{
 *   name: string,
 *   type: SchemaFieldType,
 *   required: boolean,
 * }} SchemaField
 *
 * @typedef {{
 *   fields: readonly SchemaField[],
 * }} DirectorySchema
 */

/**
 * Minimum directory entry contract for the engine.
 * Required fields: id (string), title (string).
 *
 * @returns {DirectorySchema}
 */
export function getDirectorySchema() {
  return Object.freeze({
    fields: Object.freeze([
      Object.freeze({
        name: 'id',
        type: 'string',
        required: true,
      }),
      Object.freeze({
        name: 'title',
        type: 'string',
        required: true,
      }),
    ]),
  });
}
