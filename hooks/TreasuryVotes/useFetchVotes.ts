import { formatAddress } from "../../utils/formatAddress";
import {
  CONTRACT_ADDRESS,
  VOTECAST_TOPIC0,
  provider,
  contractInterface,
} from "@lib/chains";

import { Vote } from "../../lib/api/types/votes";
import { getEnsForVotes } from "@lib/api/ens";
import { useEffect, useState } from "react";

export const useFetchVotes = (proposalId: string) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) {
      setVotes([]);
      setLoading(false);
      return;
    }

    const fetchVotes = async () => {
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
          .filter((vote) => vote.proposalId === proposalId)

          .sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));

        const uniqueVoters = Array.from(
          new Set(decodedVotes.map((v) => v.voter))
        );
        const localEnsCache: { [address: string]: string } = {};

        await Promise.all(
          uniqueVoters.map(async (address) => {
            try {
              if (localEnsCache[address]) {
                return;
              }
              const ensAddress = await getEnsForVotes(address);

              if (ensAddress && ensAddress.name) {
                localEnsCache[address] = ensAddress.name;
              } else {
                localEnsCache[address] = formatAddress(address);
              }
            } catch (e) {
              console.warn(`Failed to fetch ENS for ${address}`, e);
            }
          })
        );

        setVotes(
          decodedVotes.map((vote) => ({
            ...vote,
            ensName: localEnsCache[vote.voter],
          }))
        );
      } catch (error) {
        console.error("Error fetching logs from Infura:", error);
        setError("Failed to fetch votes");
      } finally {
        setLoading(false);
      }
    };
    fetchVotes();
  }, [proposalId]);

  return {
    votes,
    loading,
    error,
  };
};
