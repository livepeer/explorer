import { getProposalsByIds } from "@lib/api";
import {
  CONTRACT_ADDRESS,
  contractInterface,
  provider,
  VOTECAST_TOPIC0,
} from "@lib/chains";
import { GetProposalsByIdsQueryResult } from "apollo";
import { ethers } from "ethers";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { Vote } from "../../lib/api/types/votes";

export function useInfuraVoterVotes(voter: string) {
  const [logsLoading, setLogsLoading] = useState(true);
  const [rawVotes, setRawVotes] = useState<Vote[]>([]);
  const proposalIds = useMemo(
    () => Array.from(new Set(rawVotes.map((v) => v.proposalId))),
    [rawVotes]
  );

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLogsLoading(true);
      try {
        const topic = ethers.utils.zeroPad(voter, 32);
        const logs = await provider.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock: "earliest",
          toBlock: "latest",
          topics: [VOTECAST_TOPIC0, ethers.utils.hexlify(topic)],
        });
        if (cancelled) return;
        const transactions = logs.map((log) => {
          const args = contractInterface.parseLog(log).args;
          return {
            transactionHash: log.transactionHash,
            voter: args.voter,
            choiceID: args.support.toString(),
            proposalId: args.proposalId.toString(),
            weight: args.weight.toString(),
            reason: args.reason ?? "",
          };
        });
        setRawVotes(transactions);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLogsLoading(false);
      }
    }
    fetch();
    return () => {
      cancelled = true;
    };
  }, [voter]);

  const { data, isLoading: proposalsLoading } = useSWR<
    GetProposalsByIdsQueryResult["data"]
  >(
    proposalIds.length > 0 ? [`/api/treasury/proposals`, proposalIds] : null,
    async () => {
      const { proposals } = await getProposalsByIds(proposalIds);
      return proposals.data as GetProposalsByIdsQueryResult["data"];
    }
  );

  const votes: Vote[] = useMemo(() => {
    if (logsLoading || proposalsLoading) return [];
    const map = new Map<string, { description: string; voteEnd: number }>();
    data?.treasuryProposals?.forEach((p) => {
      map.set(p.id, {
        description: p.description || "",
        voteEnd: Number(p.voteEnd) || 0,
      });
    });
    return rawVotes
      .map((r) => {
        const meta = map.get(r.proposalId) ?? { description: "", voteEnd: 0 };
        const title =
          (meta.description.split("\n")[0] || "").replace(/^#\s*/, "") ||
          "Unknown Proposal";
        return {
          ...r,
          endVote: meta.voteEnd,
          description: meta.description,
          proposalTitle: title,
        };
      })
      .sort((a, b) => b.endVote - a.endVote);
  }, [rawVotes, data, logsLoading, proposalsLoading]);

  return { votes, isLoading: logsLoading || proposalsLoading };
}
