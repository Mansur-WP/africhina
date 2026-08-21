/**
 * Pure helpers for building catalogue URLs from the current query params.
 *
 * Kept free of React so the URL logic used by the client toolbar and
 * pagination controls can be unit-tested in isolation.
 */

/**
 * Build a query string from the current params plus a set of updates.
 * Setting a value to `null`, `undefined` or `''` removes that key.
 *
 * @param {string|URLSearchParams|Record<string,string>} current
 * @param {Record<string, string|number|null|undefined>} updates
 * @returns {string} e.g. "?q=phone&page=2" (or "" when empty).
 */
export function buildCatalogueQuery(current, updates = {}) {
  const params = new URLSearchParams(current ?? '');

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}
