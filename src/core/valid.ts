import { Soul, GunValue } from '../types/message';

// Valid values are a subset of JSON: null, binary, number (!Infinity), text,
// or a soul relation. Arrays need special algorithms to handle concurrency,
// so they are not supported directly.

/**
 * Check if a value is valid GUN data.
 * Valid types: null, string, boolean, number (!Infinity, !NaN), or a soul reference.
 */
export function isValidValue(v: any): v is GunValue {
  return v === null ||
    typeof v === 'string' ||
    typeof v === 'boolean' ||
    (typeof v === 'number' && v !== Infinity && v !== -Infinity && v === v) ||
    (!!v && typeof v['#'] === 'string' && Object.keys(v).length === 1 && !!v['#']);
}

/**
 * Check if a value is a soul reference (link to another node).
 */
export function isSoul(v: any): v is Soul {
  return !!v && typeof v['#'] === 'string' && Object.keys(v).length === 1 && !!v['#'];
}

/**
 * Extract a soul reference from a valid link value.
 * Returns the soul string if valid, undefined otherwise.
 */
export function getSoul(v: any): string | undefined {
  if (!!v && typeof v['#'] === 'string' && Object.keys(v).length === 1) {
    return v['#'];
  }
  return undefined;
}
