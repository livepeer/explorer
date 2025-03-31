import { ethers } from "ethers";
import { gql, ApolloClient, InMemoryCache } from "@apollo/client";
import {
  CONTRACT_ADDRESS,
  VOTECAST_TOPIC0,
  provider,
  contractInterface,
} from "./contracts";

import {
  ENS_QUERY
} from "./queries"; 

const ensClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_ENS_API_URI,
  cache: new InMemoryCache(),
});

export const fetchVotesFromInfura = async (proposalId: string) => {
  try {
    const logs = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      fromBlock: "earliest",
      toBlock: "latest",
      topics: [VOTECAST_TOPIC0],
    });

    const votes = logs
      .map((log) => {
        const decoded = contractInterface.parseLog(log);
        return {
          transactionHash: log.transactionHash,
          voter: decoded?.args.voter.toLowerCase() || "", 
          choiceID: decoded?.args.support.toString() || "",
          proposalId: decoded?.args.proposalId.toString() || "",
          weight: ethers.utils.formatUnits(decoded?.args.weight.toString() || "0", 18),
          reason: decoded?.args.reason || "No reason provided",
        };
      })
      .filter((vote) => vote.proposalId === proposalId);

    if (votes.length === 0) return votes;

    const uniqueVoters = Array.from(new Set(votes.map((vote) => vote.voter)));

    const { data } = await ensClient.query({
      query: ENS_QUERY,
      variables: { addresses: uniqueVoters },
    });

    const ensMap: { [key: string]: string } = {};
    if (data?.domains) {
      data.domains.forEach((domain: { resolvedAddress: { id: string }; name: string }) => {
        ensMap[domain.resolvedAddress.id.toLowerCase()] = domain.name;
      });
    }

    return votes.map((vote) => ({
      ...vote,
      voter: ensMap[vote.voter] || vote.voter,
    }));
  } catch (error) {
    console.log("Error fetching logs from Infura:", error);
    return [];
  }
};