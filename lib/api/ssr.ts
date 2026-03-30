import {
  AccountDocument,
  AccountQuery,
  AccountQueryVariables,
  CurrentRoundDocument,
  CurrentRoundQuery,
  CurrentRoundQueryVariables,
  EventsDocument,
  EventsQuery,
  EventsQueryVariables,
  GatewaysDocument,
  GatewaySelfRedeemDocument,
  GatewaySelfRedeemQuery,
  GatewaySelfRedeemQueryVariables,
  GatewaysQuery,
  GatewaysQueryVariables,
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
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const minActiveDay = Math.max(currentTimestamp - 365 * 86400, 0); // include activated last 12 months

  // TODO: if gateways exceed 250, bump `first` to 1000 or implement client-side
  // lazy-loading pagination to fetch remaining pages on demand.
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

export async function getGatewaySelfRedeem(
  client = getApollo(),
  account: string,
  windowDays = 90
) {
  const cutoff = Math.floor(Date.now() / 1000) - windowDays * 86400;

  const result = await client.query<
    GatewaySelfRedeemQuery,
    GatewaySelfRedeemQueryVariables
  >({
    query: GatewaySelfRedeemDocument,
    variables: { account },
  });

  const lastTimestamp = Number(
    result.data?.winningTicketRedeemedEvents?.[0]?.transaction?.timestamp ?? 0
  );

  return lastTimestamp >= cutoff;
}

export async function getCurrentRound(client = getApollo()) {
  return client.query<CurrentRoundQuery, CurrentRoundQueryVariables>({
    query: CurrentRoundDocument,
  });
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
