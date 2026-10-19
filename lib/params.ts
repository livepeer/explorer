/**
 * A route segment, decoded once. A malformed escape (e.g. `%252` decoded
 * twice, or a stray `%`) throws in decodeURIComponent; here it's returned
 * as is, so the page's own validation shows "not found" instead of crashing.
 */
export function routeParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
