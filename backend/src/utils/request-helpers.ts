/**
 * Request Helper Utilities
 *
 * Type-safe utilities for extracting values from Express request objects.
 * Handles the string | string[] | undefined types from req.params and req.query.
 */

/**
 * Safely extract a string value from request params or query.
 * Returns the first value if an array is provided.
 *
 * @param value - The value from req.params or req.query
 * @returns The string value or undefined
 */
export function getString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Safely extract a required string value.
 * Throws an error if the value is missing.
 *
 * @param value - The value from req.params or req.query
 * @param fieldName - The name of the field (for error messages)
 * @returns The string value
 * @throws Error if value is undefined
 */
export function getRequiredString(value: string | string[] | undefined, fieldName: string): string {
  const result = getString(value);
  if (result === undefined) {
    throw new Error(`Missing required field: ${fieldName}`);
  }
  return result;
}

/**
 * Safely extract a number from request params or query.
 *
 * @param value - The value from req.params or req.query
 * @returns The parsed number or undefined
 */
export function getNumber(value: string | string[] | undefined): number | undefined {
  const str = getString(value);
  if (str === undefined) return undefined;
  const num = Number(str);
  return isNaN(num) ? undefined : num;
}

/**
 * Safely extract a required number.
 *
 * @param value - The value from req.params or req.query
 * @param fieldName - The name of the field (for error messages)
 * @returns The parsed number
 * @throws Error if value is undefined or not a valid number
 */
export function getRequiredNumber(value: string | string[] | undefined, fieldName: string): number {
  const result = getNumber(value);
  if (result === undefined) {
    throw new Error(`Missing or invalid required field: ${fieldName}`);
  }
  return result;
}

/**
 * Safely extract a boolean from request params or query.
 * Accepts: 'true', '1', 'yes' as true; 'false', '0', 'no' as false
 *
 * @param value - The value from req.params or req.query
 * @returns The parsed boolean or undefined
 */
export function getBoolean(value: string | string[] | undefined): boolean | undefined {
  const str = getString(value);
  if (str === undefined) return undefined;
  const lower = str.toLowerCase();
  if (['true', '1', 'yes'].includes(lower)) return true;
  if (['false', '0', 'no'].includes(lower)) return false;
  return undefined;
}

/**
 * Safely extract a string array from request query.
 * Handles both single values and arrays.
 *
 * @param value - The value from req.query
 * @returns An array of strings (empty if undefined)
 */
export function getStringArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Extract tenant ID from request headers.
 * Standardized header name: x-tenant-id
 *
 * @param headers - The request headers object
 * @returns The tenant ID or undefined
 */
export function getTenantId(headers: Record<string, string | string[] | undefined>): string | undefined {
  return getString(headers['x-tenant-id']);
}

/**
 * Extract required tenant ID from request headers.
 *
 * @param headers - The request headers object
 * @returns The tenant ID
 * @throws Error if tenant ID is missing
 */
export function getRequiredTenantId(headers: Record<string, string | string[] | undefined>): string {
  const tenantId = getTenantId(headers);
  if (!tenantId) {
    throw new Error('Missing required header: x-tenant-id');
  }
  return tenantId;
}