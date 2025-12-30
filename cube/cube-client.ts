import cubejs, { Query } from "@cubejs-client/core";

export enum CUBE_TYPE {
  SERVER = "SERVER",
  CLIENT = "CLIENT",
  PUBLIC = "PUBLIC",
}

const CUBE_BASE_URL = "https://cube.dev.analytics.pyor.xyz";
const cubePublicAuthToken = process.env.CUBE_PUBLIC_TOKEN || "";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cubejsApiClient = cubejs("CUBEJS-API-TOKEN", {
  apiUrl: `/api/services/cube/cubejs-api/v1`,
});

const cubejsApiPublic = cubejs(cubePublicAuthToken, {
  apiUrl: `${CUBE_BASE_URL}/cubejs-api/v1`,
});

export async function getCubeData(
  query: Query,
  options: {
    type: CUBE_TYPE;
    headerData?: { token: string };
  } = {
    type: CUBE_TYPE.CLIENT,
  }
) {
  const cubejsApi =
    options.type === CUBE_TYPE.CLIENT
      ? cubejsApiPublic
      : options.type === CUBE_TYPE.SERVER
      ? cubejs(options.headerData?.token || "", {
          apiUrl: `${CUBE_BASE_URL}/cubejs-api/v1`,
        })
      : cubejsApiPublic;

  try {
    const resultSet = await cubejsApi.load(query);
    const response = resultSet.rawData();
    return response;
  } catch (error) {
    console.error(error);
  }
}
