type RetryOpts = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number; // per-attempt timeout
  retryOnMethods?: string[]; // defaults to idempotent
};

const IDEMPOTENT = ["GET", "HEAD", "PUT", "DELETE", "OPTIONS"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const expBackoffJitter = (attempt: number, base: number, cap: number) =>
  Math.floor(Math.random() * Math.min(cap, base * 2 ** attempt));

const parseRetryAfter = (h: string | null): number | null => {
  if (!h) return null;
  const secs = Number(h);
  if (!Number.isNaN(secs)) return Math.max(0, Math.floor(secs * 1000));
  const when = Date.parse(h);
  return Number.isNaN(when) ? null : Math.max(0, when - Date.now());
};

function mergeSignalsPolyfill(signals: AbortSignal[]): AbortSignal {
  const ctrl = new AbortController();
  const abort = (s: AbortSignal) => ctrl.abort((s as any).reason);
  for (const s of signals) {
    if (!s) continue;
    if (s.aborted) {
      abort(s);
      break;
    }
    s.addEventListener("abort", () => abort(s), { once: true });
  }
  return ctrl.signal;
}

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

  const originalReq = new Request(input, init);

  let lastResponse: Response | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // per-attempt timeout + caller signal merged
    const timeoutCtrl = new AbortController();
    const timeoutId = setTimeout(() => timeoutCtrl.abort(), timeoutMs);
    const userSignal = init.signal as AbortSignal | undefined;
    const signals = [timeoutCtrl.signal, userSignal].filter(
      Boolean
    ) as AbortSignal[];
    const signal =
      signals.length === 1
        ? signals[0]
        : (AbortSignal as any).any
        ? (AbortSignal as any).any(signals)
        : mergeSignalsPolyfill(signals);

    try {
      const req = attempt === 0 ? originalReq : originalReq.clone();
      const res = await fetch(req, { signal });

      clearTimeout(timeoutId);

      if (res.ok) return res;

      // remember the last non-OK response to return if we give up
      lastResponse = res;

      const status = res.status;
      const shouldRetry =
        allowRetry &&
        (status === 408 ||
          status === 425 ||
          status === 429 ||
          (status >= 500 && status !== 501 && status !== 505));

      if (!shouldRetry || attempt === retries) {
        // surface the final response rather than throwing an undefined error
        return res;
      }

      const ra = parseRetryAfter(res.headers.get("retry-after"));
      await sleep(ra ?? expBackoffJitter(attempt, baseDelayMs, maxDelayMs));
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      // if caller aborted, fail immediately (don't retry)
      if (userSignal?.aborted) throw err;

      const isAbort = err?.name === "AbortError";
      const isNetwork = err?.name === "TypeError" || err?.code === "ECONNRESET";
      const canRetry = allowRetry && (isAbort || isNetwork);

      if (!canRetry || attempt === retries) {
        const reason = err?.message || "Request failed after retries";
        throw new Error(reason);
      }

      await sleep(expBackoffJitter(attempt, baseDelayMs, maxDelayMs));
    }
  }

  // Fallback: if we somehow exit the loop:
  if (lastResponse) return lastResponse;
  throw new Error(
    (lastError as any)?.message ?? "Request failed after retries (no response)"
  );
}
