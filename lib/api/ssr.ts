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
  OrchestratorsSortedDocument,
  OrchestratorsSortedQuery,
  OrchestratorsSortedQueryVariables,
  ProtocolDocument,
  ProtocolQuery,
  ProtocolQueryVariables,
} from "../../apollo";
import { EnsIdentity } from "./types/get-ens";

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

  // const ensIdentities = await Promise.all(
  //   orchestrators.data.transcoders.map((e) => getEnsIdentity(e.id))
  // );

  return {
    fallback: {},
    // ensIdentities.reduce(
    //   (prev, curr) => ({ ...prev, [curr.id]: curr }),
    //   {}
    // ),
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

  // const ensIdentities = [await getEnsIdentity(orchestrator.data.transcoder.id)];

  return {
    fallback: {},
    // ensIdentities.reduce(
    //   (prev, curr) => ({ ...prev, [curr.id]: curr }),
    //   {}
    // ),
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

  // const ensIdentities = [await getEnsIdentity(orchestrator.data.transcoder.id)];

  return {
    fallback: {},
    // ensIdentities.reduce(
    //   (prev, curr) => ({ ...prev, [curr.id]: curr }),
    //   {}
    // ),
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

  // const ensIdentitiesTranscoders = await Promise.all(
  //   events.data.transcoders.map((e) => getEnsIdentity(e.id))
  // );

  // const ensIdentities = await Promise.all(
  //   events.data.transactions.flatMap((t) =>
  //     t.events.map((e) => getEnsIdentity(e.transaction.from))
  //   )
  // );

  return {
    fallback: {},
    // [...ensIdentitiesTranscoders, ...ensIdentities].reduce(
    //   (prev, curr) => ({ ...prev, [curr.id]: curr }),
    //   {}
    // ),
    events,
  };
}

export const server =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "https://explorer.livepeer.org";

async function getEnsIdentity(address: string) {
  try {
    const response = await fetch(
      `${server}/api/ens-data/${address.toLowerCase()}`
    );

    const identity: EnsIdentity = await response.json();

    return identity;
  } catch (e) {
    console.error(e);
  }

  const idShort = address.replace(address.slice(6, 38), "…");
  const ens: EnsIdentity = {
    id: address,
    idShort,
    name: null,
  };

  return ens;
}
