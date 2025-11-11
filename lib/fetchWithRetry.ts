type RetryOpts = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number; // per-attempt timeout
  retryOnMethods?: string[]; // defaults to idempotent
};

const IDEMPOTENT = ["GET", "HEAD", "PUT", "DELETE", "OPTIONS"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const expBackoffJitter = (attempt: number, base: number, cap: number) => {
  const exp = Math.min(cap, base * 2 ** attempt);
  return Math.floor(Math.random() * exp);
};

const parseRetryAfter = (h: string | null): number | null => {
  if (!h) return null;
  const secs = Number(h);
  if (!Number.isNaN(secs)) return Math.max(0, Math.floor(secs * 1000));
  const when = Date.parse(h);
  return Number.isNaN(when) ? null : Math.max(0, when - Date.now());
};

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  opts: RetryOpts = {}
): Promise<Response> {
  const {
    retries = 3,
    baseDelayMs = 300,
    maxDelayMs = 5000,
    timeoutMs = 10_000,
    retryOnMethods = IDEMPOTENT,
  } = opts;

  const method = (init.method || "GET").toUpperCase();
  const allowRetry = retryOnMethods.includes(method);

  const originalReq = new Request(input as any, init);
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const timeoutCtrl = new AbortController();
    const timeoutId = setTimeout(() => timeoutCtrl.abort(), timeoutMs);

    try {
      const req = attempt === 0 ? originalReq : originalReq.clone();
      const res = await fetch(req, { signal: timeoutCtrl.signal });

      clearTimeout(timeoutId);

      if (res.ok) return res;

      const status = res.status;
      const shouldRetry =
        allowRetry &&
        (status === 408 || status === 425 || status === 429 || (status >= 500 && status !== 501 && status !== 505));

      if (!shouldRetry || attempt === retries) return res;

      const ra = parseRetryAfter(res.headers.get("retry-after"));
      await sleep(ra ?? expBackoffJitter(attempt, baseDelayMs, maxDelayMs));
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastErr = err;

      const isAbort = err?.name === "AbortError";
      const isNetwork = err?.name === "TypeError" || err?.code === "ECONNRESET";
      const canRetry = allowRetry && (isAbort || isNetwork);

      if (!canRetry || attempt === retries) throw err;

      await sleep(expBackoffJitter(attempt, baseDelayMs, maxDelayMs));
    }
  }

  throw lastErr;
}
