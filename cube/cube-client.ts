import cubejs, { QueryType } from "@cubejs-client/core";

export enum CUBE_TYPE {
  SERVER = "SERVER",
  CLIENT = "CLIENT",
  PUBLIC = "PUBLIC",
}

const CUBE_BASE_URL ="https://cube.dev.analytics.pyor.xyz" ;
let cubePublicAuthToken = process.env.CUBE_PUBLIC_TOKEN || "";

const cubejsApiClient = cubejs("CUBEJS-API-TOKEN", {
  apiUrl: `/api/services/cube/cubejs-api/v1`,
});

const cubejsApiPublic = cubejs(cubePublicAuthToken, {
  apiUrl: `${CUBE_BASE_URL}/cubejs-api/v1`,
});

export async function getCubeData(
  query: any,
  options: {
    type: CUBE_TYPE;
    headerData?: { token: any };
  } = {
    type: CUBE_TYPE.CLIENT,
  }
) {
  let cubejsApi =
    options.type === CUBE_TYPE.CLIENT
      ? cubejsApiPublic
      : options.type === CUBE_TYPE.SERVER
      ? cubejs(options.headerData?.token, {
          apiUrl: `${CUBE_BASE_URL}/cubejs-api/v1`,
        })
      : cubejsApiPublic;

  try {
    const resultSet: any = await cubejsApi.load(query);
    const response = resultSet.loadResponse.results;
    return response;
  } catch (error) {
    console.error(error);
  }
}


