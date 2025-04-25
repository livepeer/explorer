import { ApolloClient, InMemoryCache } from "@apollo/client";
import { formatAddress } from "../utils/formatAddress";
import {
  CONTRACT_ADDRESS,
  VOTECAST_TOPIC0,
  provider,
  contractInterface,
} from "@lib/chains";

import {
  ENS_QUERY
} from "../queries/treasuryProposals"; 

interface Vote {
  transactionHash?: string;
  weight: string;
  voter: string;
  choiceID: string;
  proposalId: string;
  reason: string;
  ensName?: string;
}

const createEnsApolloClient = () =>
  new ApolloClient({
    uri: process.env.NEXT_PUBLIC_ENS_API_URI,
    cache: new InMemoryCache(),
  });

export const fetchVotesFromInfura = async (proposalId: string): Promise<Vote[]> => {
  const ensClient = createEnsApolloClient();
  try {
    const logs = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      fromBlock: "earliest",
      toBlock: "latest",
      topics: [VOTECAST_TOPIC0],
    });

    const decodedVotes = logs
      .map((log) => {
        const decoded = contractInterface.parseLog(log);
        return {
          transactionHash: log.transactionHash,
          voter: decoded?.args.voter.toLowerCase() || "",
          choiceID: decoded?.args.support.toString() || "",
          proposalId: decoded?.args.proposalId.toString() || "",
          weight: decoded?.args.weight.toString() || "0",
          reason: decoded?.args.reason || "No reason provided",
        };
      })
      .filter((vote) => vote.proposalId === proposalId);

    const uniqueVoters = Array.from(new Set(decodedVotes.map((v) => v.voter)));
    const localEnsCache: { [address: string]: string } = {};

    await Promise.all(
      uniqueVoters.map(async (address) => {
        try {
          const { data } = await ensClient.query({
            query: ENS_QUERY,
            variables: { address },
          });
          if (data?.domains?.length > 0) {
            localEnsCache[address] = data.domains[0].name;
          }
        } catch (e) {
          console.warn(`Failed to fetch ENS for ${address}`, e);
        }
      })
    );

    return decodedVotes.map((vote) => ({
      ...vote,
      ensName: localEnsCache[vote.voter] || formatAddress(vote.voter),
    }));
  } catch (error) {
    console.error("Error fetching logs from Infura:", error);
    return [];
  }
};