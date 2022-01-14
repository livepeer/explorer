import { getApollo } from "../apollo";
import { orchestratorsQuery } from "../queries/orchestratorsQuery";
import { gql } from "@apollo/client";

export async function getOrchestrators(client = getApollo()) {
  const { data: protocolData } = await client.query({
    query: gql`
      {
        protocol(id: "0") {
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
