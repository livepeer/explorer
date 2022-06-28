import { getApollo } from "../apollo";
import { orchestratorsQuery } from "../queries/orchestratorsQuery";
import { gql } from "@apollo/client";
import { chartDataQuery } from "../queries/chartDataQuery";
import { transactionsQuery } from "queries/transactionsQuery";
import { eventsQuery } from "queries/eventsQuery";

export async function getOrchestrators(client = getApollo()) {
  const { data: protocolData } = await client.query({
    query: gql`
      {
        protocol(id: "0") {
          id
          currentRound {
            id
          }
        }
      }
    `,
  });
  const query = orchestratorsQuery(protocolData.protocol.currentRound.id);
  const { data } = await client.query({
    query,
  });
  await client.cache.writeQuery({
    query,
    data,
  });
  return await client.cache.readQuery({
    query,
  });
}

export async function getEvents(client = getApollo(), first = 100) {
  const { data } = await client.query({
    query: eventsQuery,
    variables: { first },
  });
  await client.cache.writeQuery({
    query: eventsQuery,
    data,
  });
  return await client.cache.readQuery({
    query: eventsQuery,
  });
}

export async function getChartData(client = getApollo()) {
  const { data } = await client.query({
    query: chartDataQuery,
  });
  await client.cache.writeQuery({
    query: chartDataQuery,
    data,
  });
  return await client.cache.readQuery({
    query: chartDataQuery,
  });
}
