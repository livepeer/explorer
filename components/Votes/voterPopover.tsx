"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ethers } from "ethers";
import { useQuery } from "@apollo/client";
import Spinner from "@components/Spinner";
import { formatAddress } from "../../utils/formatAddress";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
} from "@livepeer/design-system";
import { GET_PROPOSALS_BY_IDS } from "../../queries/treasuryProposals";
import {
  CONTRACT_ADDRESS,
  VOTECAST_TOPIC0,
  provider,
  contractInterface,
} from "@lib/chains";

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
}

interface VoterPopoverProps {
  voter: string;
  onClose: () => void;
}

const VoterPopover: React.FC<VoterPopoverProps> = ({ voter, onClose }) => {
  const [logsLoading, setLogsLoading] = useState(true);
  const [proposalIds, setProposalIds] = useState<string[]>([]);
  const [rawVotes, setRawVotes] = useState<any[]>([]); 
 
  useEffect(() => {
    const fetchLogsForVoter = async () => {
      setLogsLoading(true);
      try {
        const voterTopic = ethers.utils.zeroPad(voter, 32);
        const logs = await provider.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock: "earliest",
          toBlock: "latest",
          topics: [VOTECAST_TOPIC0, ethers.utils.hexlify(voterTopic)],
        });

        const decodedVotes: any[] = [];
        const proposalIdsSet = new Set<string>();

        logs.forEach((log) => {
          const decoded = contractInterface.parseLog(log);
          const proposalId = decoded?.args.proposalId.toString();
          decodedVotes.push({
            transactionHash: log.transactionHash,
            voter: decoded?.args.voter,
            proposalId,
            choiceID: decoded?.args.support.toString(),
            weight: decoded?.args.weight.toString(),
            reason: decoded?.args.reason,
          });
          proposalIdsSet.add(proposalId);
        });

        setRawVotes(decodedVotes);
        setProposalIds(Array.from(proposalIdsSet));
      } catch (error) {
        console.error("Error fetching logs for voter:", error);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchLogsForVoter();
  }, [voter]);

  const { data, loading: proposalsLoading } = useQuery(GET_PROPOSALS_BY_IDS, {
    variables: { ids: proposalIds },
    skip: proposalIds.length === 0,
  });

  const votes: Vote[] = React.useMemo(() => {
    if (logsLoading || proposalsLoading) return [];

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
        maxHeight: "90%",
        overflowY: "auto",
        width: "90%",
        "@bp2": { width: "50%" },
        zIndex: 10,
        marginTop: "$6",
      }}>
        <Button variant="gray" css={{
          position: "absolute",
          top: "$2",
          right: "$2",
        }}  onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}>
          Close
        </Button>
        {isLoading ? (
          <Flex css={{ justifyContent: "center", alignItems: "center" }}>
             <Spinner />
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
