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
  getApollo,
  OrchestratorsDocument,
  OrchestratorsQuery,
  OrchestratorsQueryVariables,
  ProtocolDocument,
  ProtocolQuery,
  ProtocolQueryVariables,
} from "../apollo";

export async function getProtocol(client = getApollo()) {
  return client.query<ProtocolQuery, ProtocolQueryVariables>({
    query: ProtocolDocument,
  });
}

export async function getOrchestrators(client = getApollo()) {
  const protocolResponse = await client.query<
    CurrentRoundQuery,
    CurrentRoundQueryVariables
  >({
    query: CurrentRoundDocument,
  });

  return client.query<OrchestratorsQuery, OrchestratorsQueryVariables>({
    query: OrchestratorsDocument,
    variables: {
      currentRound: protocolResponse?.data?.protocol?.currentRound?.id,
      currentRoundString: protocolResponse?.data?.protocol?.currentRound?.id,
    },
  });
}

export async function getOrchestrator(client = getApollo(), id: string) {
  const query = AccountDocument;

  return client.query<AccountQuery, AccountQueryVariables>({
    query,
    variables: {
      account: id,
    },
  });
}

export async function getEvents(client = getApollo(), first = 100) {
  const query = EventsDocument;

  return client.query<EventsQuery, EventsQueryVariables>({
    query,
    variables: {
      first,
    },
  });
}

// export async function getChartData(client = getApollo()) {
//   const { data } = await client.query({
//     query: chartDataQuery,
//   });
//   await client.cache.writeQuery({
//     query: chartDataQuery,
//     data,
//   });
//   return await client.cache.readQuery({
//     query: chartDataQuery,
//   });
// }
