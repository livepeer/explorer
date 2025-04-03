"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ethers } from "ethers";
import { useQuery } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
} from "@livepeer/design-system";
import { GET_PROPOSALS_BY_IDS, GET_PROPOSALS_VOTES } from "./queries";
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

  // Replace Tailwind-based support styling with Livepeer design tokens.
  const getSupportStyles = (choiceID: string) => {
    switch (choiceID) {
      case "1":
        return { color: "$green9", fontWeight: 600 };
      case "0":
        return { color: "$red9", fontWeight: 600 };
      default:
        return { color: "$yellow9", fontWeight: 600 };
    }
  };

  // Helper to format addresses.
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
    <Box css={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(4px)",
    }}>
      <Box css={{
        position: "relative",
        backgroundColor: "$neutral3",
        padding: "$4",
        paddingTop: "$6",
        borderRadius: "$2",
        maxHeight: "100%",
        overflowY: "auto",
        width: "90%",
        "@bp2": { width: "50%" },
        zIndex: 10,
      }}>
        <Button variant="gray" css={{
          position: "absolute",
          top: "$2",
          right: "$2",
        }} onClick={onClose}>
          Close
        </Button>
        {isLoading ? (
          <Flex css={{ justifyContent: "center", alignItems: "center" }}>
            <Text>Loading votes...</Text>
          </Flex>
        ) : votes.length > 0 ? (
          votes.map((vote, index) => (
            <Box key={index} css={{
              backgroundColor: "$neutral4",
              padding: "$4",
              borderRadius: "$2",
              marginTop: "$2",
            }}>
              <Heading as="h2" css={{ fontSize: "$3", mb: "$2", color: "$white" }}>
                {vote.proposalTitle}
              </Heading>
              <Text css={{ color: "$neutral11", marginBottom: "$1" }}>
                <strong>Proposal ID:</strong> {formatAddress(vote.proposalId)}
              </Text>
              <Text css={{ color: "$neutral11", marginBottom: "$1" }}>
                <strong>Support:</strong>{" "}
                <Text as="span" css={getSupportStyles(vote.choiceID)}>
                  {vote.choiceID === "1" ? "Yes" : vote.choiceID === "2" ? "Abstain" : "No"}
                </Text>
              </Text>
              <Text css={{ color: "$neutral11", marginBottom: "$1" }}>
                <strong>Weight:</strong>{" "}
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(parseFloat(vote.weight) / 1e18)}{" "}
                LPT
              </Text>
              <Text css={{ color: "$neutral11", marginBottom: "$1" }}>
                <strong>Reason:</strong> {vote.reason || "No reason provided"}
              </Text>
            </Box>
          ))
        ) : (
          <Text css={{ color: "$neutral11" }}>No votes found for this voter.</Text>
        )}
      </Box>
    </Box>
  );

  return createPortal(popoverContent, document.body);
};

export default VoterPopover;

function zeroPadValue(voter: string, length: number): string {
  return ethers.utils.hexlify(ethers.utils.zeroPad(voter, length));
}
