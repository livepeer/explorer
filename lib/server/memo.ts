/**
 * A small in-process cache for server work behind public URLs (share cards,
 * health checks, API routes). Each key's result is kept for `ttlMs`, misses
 * as well as hits, and concurrent callers share one in-flight promise, so a
 * burst of requests for the same thing makes one upstream call. Failures
 * aren't kept. The cache holds at most `max` keys, dropping the oldest.
 *
 * It's per server instance, so it bounds repeated work rather than replacing
 * a shared cache or a rate limit in front of the app.
 */
export function memoize<T>(
  fn: (key: string) => Promise<T>,
  { ttlMs, max = 1_000 }: { ttlMs: number; max?: number }
): (key: string) => Promise<T> {
  const entries = new Map<string, { at: number; value: Promise<T> }>();
  return (key) => {
    const now = Date.now();
    const hit = entries.get(key);
    if (hit && now - hit.at < ttlMs) return hit.value;
    const value = fn(key);
    entries.delete(key);
    entries.set(key, { at: now, value });
    value.catch(() => {
      if (entries.get(key)?.value === value) entries.delete(key);
    });
    // Maps keep insertion order: the first key is the oldest.
    while (entries.size > max) {
      entries.delete(entries.keys().next().value!);
    }
    return value;
  };
}

/**
 * Read a response body as text, refusing more than `maxBytes`: a declared
 * length over it, or a stream that runs past it. For documents fetched by an
 * identifier anyone can choose (IPFS hashes), so one can't exhaust memory.
 */
export async function readCapped(
  res: Response,
  maxBytes: number
): Promise<string> {
  const declared = Number(res.headers.get("content-length"));
  if (declared > maxBytes) throw new Error("Response too large");
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("Response too large");
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

/** An IPFS content identifier: CIDv0 (Qm…) or a base32 CIDv1 (b…). */
export const isCid = (s: string) =>
  /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(s) || /^b[a-z2-7]{58,}$/.test(s);

/**
 * A fixed-window request limit per key (e.g. a client IP): true while the
 * key has made fewer than `limit` calls in the current `windowMs`. Like
 * memoize, it's per server instance, a brake rather than a hard quota.
 */
export function rateLimiter({
  limit,
  windowMs,
  max = 10_000,
}: {
  limit: number;
  windowMs: number;
  max?: number;
}) {
  const windows = new Map<string, { start: number; count: number }>();
  return (key: string): boolean => {
    const now = Date.now();
    const w = windows.get(key);
    if (!w || now - w.start >= windowMs) {
      windows.delete(key);
      windows.set(key, { start: now, count: 1 });
      while (windows.size > max) windows.delete(windows.keys().next().value!);
      return true;
    }
    w.count++;
    return w.count <= limit;
  };
}

/** The client's address as the platform reports it, for rate limiting. */
export function clientKey(request: Request) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
