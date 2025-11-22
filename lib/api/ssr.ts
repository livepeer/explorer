import {
  AccountDocument,
  AccountQuery,
  AccountQueryVariables,
  CurrentRoundDocument,
  CurrentRoundQuery,
  CurrentRoundQueryVariables,
  GatewaysDocument,
  GatewaysQuery,
  GatewaysQueryVariables,
  EventsDocument,
  EventsQuery,
  EventsQueryVariables,
  getApollo,
  OrchestratorsDocument,
  OrchestratorsQuery,
  OrchestratorsQueryVariables,
  OrchestratorsSortedDocument,
  OrchestratorsSortedQuery,
  OrchestratorsSortedQueryVariables,
  ProtocolDocument,
  ProtocolQuery,
  ProtocolQueryVariables,
} from "../../apollo";

export async function getProtocol(client = getApollo()) {
  return client.query<ProtocolQuery, ProtocolQueryVariables>({
    query: ProtocolDocument,
  });
}

export async function getGateways(client = getApollo()) {
  const currentDay = Math.floor(Date.now() / 1000 / 86400);
  const minActiveDay = Math.max(currentDay - 90, 0); // include activated last 90d

  const gateways = await client.query<GatewaysQuery, GatewaysQueryVariables>({
    query: GatewaysDocument,
    variables: {
      first: 250,
      skip: 0,
      minActiveDay,
    },
  });

  return {
    fallback: {},
    gateways,
  };
}

export async function getOrchestrators(client = getApollo()) {
  const protocolResponse = await client.query<
    CurrentRoundQuery,
    CurrentRoundQueryVariables
  >({
    query: CurrentRoundDocument,
  });

  const orchestrators = await client.query<
    OrchestratorsQuery,
    OrchestratorsQueryVariables
  >({
    query: OrchestratorsDocument,
    variables: {
      currentRound: protocolResponse?.data?.protocol?.currentRound?.id,
      currentRoundString: protocolResponse?.data?.protocol?.currentRound?.id,
    },
  });

  return {
    fallback: {},
    orchestrators,
  };
}

export async function getAccount(client = getApollo(), id: string) {
  const query = AccountDocument;

  const account = await client.query<AccountQuery, AccountQueryVariables>({
    query,
    variables: {
      account: id,
    },
  });

  return {
    fallback: {},
    account,
  };
}

export async function getSortedOrchestrators(client = getApollo()) {
  const query = OrchestratorsSortedDocument;

  const sortedOrchestrators = await client.query<
    OrchestratorsSortedQuery,
    OrchestratorsSortedQueryVariables
  >({
    query,
  });

  return {
    fallback: {},
    sortedOrchestrators,
  };
}

export async function getEvents(client = getApollo(), first = 100) {
  const events = await client.query<EventsQuery, EventsQueryVariables>({
    query: EventsDocument,
    variables: {
      first,
    },
  });

  return {
    fallback: {},
    events,
  };
}

export const server =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "https://explorer.livepeer.org";
