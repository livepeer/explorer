export const fetcher = <T>(url: string): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  return fetch(`/api${url}`, { signal: controller.signal })
    .then(async (res) => {
      clearTimeout(timeoutId);
      if (!res.ok) {
        const apiError = await res.json().catch(() => null);
        if (apiError?.code) {
          const errorMessage = apiError.error ?? "An unknown error occurred";
          throw new Error(`${apiError.code}: ${errorMessage}`);
        }
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json() as Promise<T>;
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw err;
    });
};
