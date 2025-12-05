import { Application, APPLICATIONS } from "./applications";
import { MEDIA_APIS,MediaApi } from "./mediaApis";

export type EcosystemItem =
  | ({ type: "application" } & Application)
  | ({ type: "media_api" } & MediaApi);

export const ECOSYSTEM_ITEMS: EcosystemItem[] = [
  ...APPLICATIONS.map((app) => ({ type: "application" as const, ...app })),
  ...MEDIA_APIS.map((api) => ({ type: "media_api" as const, ...api })),
];
