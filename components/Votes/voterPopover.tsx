"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { utils } from "ethers";
// import Image from "next/image";
import ArbitrumIcon from "../../public/img/logos/arbitrum.svg";
import { ethers } from "ethers";
import { useQuery } from "@apollo/client";
import { GET_PROPOSALS_BY_IDS, GET_PROPOSALS_VOTES } from "./queries";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import {
  CONTRACT_ADDRESS,
  VOTECAST_TOPIC0,
  provider,
  contractInterface,
} from "./contracts";



interface Vote {
  endVote: number;
  description: string;
  transactionHash?: string;
  weight: string;
  voter: string;
  choiceID: string;
  proposalId: string;
  reason: string;
  proposalTitle: string;
  [x: string]: ReactNode;
}

interface VoterPopoverProps {
  voter: string;
  proposalId: string;
  onClose: () => void;
}

const clientInstance = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
});

const fetchProposalByIdGraphQL = async (
  proposalId: string
): Promise<{ title: string; endVote: number; description: string }> => {
  try {
    const { data } = await clientInstance.query({ query: GET_PROPOSALS_VOTES });
    const proposal = data.treasuryProposals.find((p: any) => p.id === proposalId);

    if (!proposal || !proposal.description || !proposal.voteEnd) {
      console.error(`Proposal data missing for ID: ${proposalId}`, proposal);
      return {
        title: "Unknown Proposal",
        endVote: 0,
        description: "No description available.",
      };
    }

    const title = proposal.description.split("\n")[0].replace(/^#\s*/, "");
    return {
      title,
      endVote: proposal.voteEnd,
      description: proposal.description,
    };
  } catch (error) {
    console.error(`Error fetching proposal ${proposalId}:`, error);
    return { title: "Unknown Proposal", endVote: 0, description: "No description available." };
  }
};

const fetchVotesByVoter = async (voter: string, proposalId: string): Promise<Vote[]> => {
  try {
    const voterTopic = ethers.utils.zeroPad(voter, 32);
    const logs = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      fromBlock: "earliest",
      toBlock: "latest",
      topics: [VOTECAST_TOPIC0, ethers.utils.hexlify(voterTopic)],
    });

    const proposalsMap = new Map<string, { title: string; endVote: number; description: string }>();

    const votesWithDetails = await Promise.all(
      logs.map(async (log) => {
        const decoded = contractInterface.parseLog(log);
        const proposalIdFromLog = decoded?.args.proposalId.toString();

        if (!proposalsMap.has(proposalIdFromLog)) {
          const proposal = await fetchProposalByIdGraphQL(proposalIdFromLog);
          proposalsMap.set(proposalIdFromLog, proposal);
        }

        const proposal = proposalsMap.get(proposalIdFromLog);

        return {
          transactionHash: log.transactionHash,
          voter: decoded?.args.voter,
          choiceID: decoded?.args.support.toString(),
          proposalId: proposalIdFromLog,
          weight: decoded?.args.weight.toString(),
          reason: decoded?.args.reason,
          endVote: proposal?.endVote || 0,
          description: proposal?.description || "No description available.",
          proposalTitle: proposal?.title || "Unknown Proposal",
        };
      })
    );

    return votesWithDetails.sort((a, b) => a.endVote - b.endVote);
  } catch (error) {
    console.error("Error fetching votes for voter:", error);
    return [];
  }
};

const VoterPopover: React.FC<VoterPopoverProps> = ({ voter, proposalId, onClose }) => {
  const [logsLoading, setLogsLoading] = useState(true);
  const [proposalIds, setProposalIds] = useState<string[]>([]);
  const [rawVotes, setRawVotes] = useState<any[]>([]); 
 
  useEffect(() => {
    const fetchLogsForVoter = async () => {
      try {
        setLogsLoading(true);
        const voterTopic = ethers.utils.zeroPad(voter, 32);
        const logs = await provider.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock: "earliest",
          toBlock: "latest",
          topics: [VOTECAST_TOPIC0, ethers.utils.hexlify(voterTopic)],
        });

        const decodedVotes = logs.map((log) => {
          const decoded = contractInterface.parseLog(log);
          return {
            transactionHash: log.transactionHash,
            voter: decoded?.args.voter,
            proposalId: decoded?.args.proposalId.toString(),
            choiceID: decoded?.args.support.toString(),
            weight: decoded?.args.weight.toString(),
            reason: decoded?.args.reason,
          };
        });

        setRawVotes(decodedVotes);

        const uniqueProposalIds = Array.from(
          new Set(decodedVotes.map((v) => v.proposalId))
        );

        setProposalIds(uniqueProposalIds);
        setLogsLoading(false);
      } catch (error) {
        console.error("Error fetching logs for voter:", error);
        setLogsLoading(false);
      }
    };

    fetchLogsForVoter();
  }, [voter, proposalId]);

  const { data, loading: proposalsLoading } = useQuery(GET_PROPOSALS_BY_IDS, {
    variables: { ids: proposalIds },
    skip: proposalIds.length === 0,
  });

  const votes: Vote[] = React.useMemo(() => {
    if (logsLoading || proposalsLoading || !rawVotes) return [];

    const proposalsMap = new Map<string, { description: string; voteEnd: number }>();
    if (data?.treasuryProposals) {
      data.treasuryProposals.forEach((p: any) => {
        proposalsMap.set(p.id, {
          description: p.description || "No description available.",
          voteEnd: p.voteEnd || 0,
        });
      });
    }

    return rawVotes
      .map((v) => {
        const subgraphData = proposalsMap.get(v.proposalId);

        const description = subgraphData?.description || "No description available.";
        const endVote = subgraphData?.voteEnd || 0;
        const title = description.split("\n")[0].replace(/^#\s*/, "") || "Unknown Proposal";

        return {
          transactionHash: v.transactionHash,
          voter: v.voter,
          choiceID: v.choiceID,
          proposalId: v.proposalId,
          weight: v.weight,
          reason: v.reason || "",
          endVote,
          description,
          proposalTitle: title,
        };
      })
      .sort((b, a) => a.endVote - b.endVote);
  }, [logsLoading, proposalsLoading, rawVotes, data]);

  const isLoading = logsLoading || proposalsLoading;

  const getSupportClasses = (choiceID: string) => {
    switch (choiceID) {
      case "1":
        return "text-green-500 font-semibold";
      case "0":
        return "text-red-500 font-semibold";
      default:
        return "text-yellow-500 font-semibold";
    }
  };

  const formatAddress = (addr: string): string => {
    if (!addr) return "";
 
    if (addr.endsWith(".xyz")) {
      return addr.length > 21 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;
    }

    if (addr.endsWith(".eth")) {
      return addr;
    }
    
    return addr.length > 21 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;
  };

  const popoverContent = (
    <div className="pt-10 pb-10 fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
    <div className="relative bg-gray-800 p-4 pt-6 rounded-lg z-10 max-h-full overflow-y-auto w-11/12 md:w-1/2">
  <button
    className="absolute top-2 right-2 text-white hover:text-red-500 transition-colors"
    onClick={onClose}
  >
    Close
  </button>

        {isLoading ? (
          <div className="flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-green-400 border-dashed rounded-full animate-spin"></div>
          </div>
        ) : votes.length > 0 ? (
          votes.map((vote, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg mt-2">
              <h2 className="text-white font-bold sml:text-md md:text-lg">
                {vote.proposalTitle}
              </h2>
              <p>
                <strong className="text-sm text-gray-300">Proposal ID: </strong>
                <span className="text-sm text-gray-300 break-all md:break-normal inline-block w-full overflow-x-auto">
                  {formatAddress(vote.proposalId)}
                </span>
              </p>
              <p>
                <strong className="text-gray-300">Support: </strong>
                <span className={getSupportClasses(vote.choiceID)}>
                  {vote.choiceID === "1" ? "Yes" : vote.choiceID === "2" ? "Abstain" : "No"}
                </span>
              </p>
              <p className="text-gray-300">
                <strong>Weight: </strong>
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(parseFloat(vote.weight) / 10 ** 18)}{" "}
                LPT
              </p>
              <p className="text-gray-300">
                <strong>Reason: </strong>
                {vote.reason || "No reason provided"}
              </p>

              <p className="mt-2">
               {vote.transactionHash ? (
                                 <a
                                 href={`https://arbiscan.io/tx/${vote.transactionHash}#eventlog`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 {/* <Image
                                   src={ArbitrumIcon}
                                   alt="Txn"
                                   width={20}
                                   height={20}
                                   className="inline-block"
                                 /> */}
                               </a>                 
                                ) : (
                                  <span>N/A</span>
                                )}
                                </p>
            </div>
          ))
        ) : (
          <p className="text-gray-300">No votes found for this voter.</p>
        )}
      </div>
    </div>
  );

  
  return createPortal(popoverContent, document.body);
};

export default VoterPopover;
function zeroPadValue(voter: string, length: number): string {
  return ethers.utils.hexlify(ethers.utils.zeroPad(voter, length));
}

