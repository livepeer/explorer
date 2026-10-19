/**
 * Sanitize a user-supplied URL for use as an external `<a href>`.
 *
 * Defaults schemeless hostnames and protocol-relative URLs to HTTPS, then
 * validates that the resulting URL parses and uses an `http:` or `https:`
 * protocol. Relative paths, query strings, fragments, unsupported schemes,
 * and malformed input are rejected.
 *
 * @param url - The user-supplied URL.
 * @returns The sanitized absolute URL, or `null` if it is unsafe / invalid.
 */
export const sanitizeExternalUrl = (
  url: string | null | undefined
): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^(?:[/?#]|\.\.?(?:\/|$))/.test(trimmed) && !trimmed.startsWith("//")) {
    return null;
  }
  const withScheme = trimmed.startsWith("//")
    ? `https:${trimmed}`
    : /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};
