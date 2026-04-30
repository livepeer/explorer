export const fetcher = <T>(url: string): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  return fetch(`/api${url}`, { signal: controller.signal })
    .then(async (res) => {
      if (!res.ok) {
        const apiError = await res.json().catch(() => null);
        clearTimeout(timeoutId);
        if (apiError?.code) {
          const errorMessage = apiError.error ?? "An unknown error occurred";
          throw new Error(`${apiError.code}: ${errorMessage}`);
        }
        const statusText = res.statusText ? ` ${res.statusText}` : "";
        throw new Error(`HTTP ${res.status}${statusText}`);
      }
      const data = (await res.json()) as T;
      clearTimeout(timeoutId);
      return data;
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw err;
    });
};
