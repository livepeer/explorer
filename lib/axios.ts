import { default as defaultAxios } from "axios";

export const axiosClient = defaultAxios.create({
  baseURL: "/api",
  timeout: 10000,
});

export const fetcher = <T>(url: string) =>
  axiosClient
    .get<T>(url)
    .then((res) => res.data)
    .catch((err) => {
      const apiError = err.response?.data;
      if (apiError?.code) {
        const errorMessage = apiError.error ?? "An unknown error occurred";
        throw new Error(`${apiError.code}: ${errorMessage}`);
      }
      throw err;
    });
