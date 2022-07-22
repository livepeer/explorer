import { default as defaultAxios } from "axios";

export const axiosClient = defaultAxios.create({
  baseURL: "/api",
  timeout: 10000,
});

export const fetcher = <T>(url: string) =>
  axiosClient.get<T>(url).then((res) => res.data);
