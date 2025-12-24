"use client";

import Spinner from "@components/Spinner";
import { Box, Flex, Link, Text } from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import React from "react";

import { useInfuraVoterVotes } from "../../../hooks/TreasuryVotes/useInfuraVoterVotes";
import VoteDetail from "../VoteDetail";
import VoteModal from "../VoteModal";

interface VoterPopoverProps {
  voter: string;
  ensName?: string;
  onClose: () => void;
}

const Index: React.FC<VoterPopoverProps> = ({ voter, ensName, onClose }) => {
  const { votes, isLoading } = useInfuraVoterVotes(voter);

  const stats = React.useMemo(() => {
    if (!votes.length) return null;
    return {
      total: votes.length,
      for: votes.filter((v) => v.choiceID === "1").length,
      against: votes.filter((v) => v.choiceID === "0").length,
      abstain: votes.filter((v) => v.choiceID === "2").length,
    };
  }, [votes]);

  const summaryHeader = React.useMemo(() => {
    return (
      <Box>
        <Flex css={{ alignItems: "center", gap: "$2", marginBottom: "$2" }}>
          <Link
            href={`https://explorer.livepeer.org/accounts/${voter}/delegating`}
            target="_blank"
            css={{
              fontSize: "$1",
              color: "$primary11",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "$1",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {ensName || voter}
            <Box as={ArrowTopRightIcon} css={{ width: 12, height: 12 }} />
          </Link>
        </Flex>
        {stats && (
          <Flex css={{ gap: "$4", alignItems: "center" }}>
            <Flex css={{ alignItems: "center", gap: "$1" }}>
              <Text size="1" css={{ color: "$neutral11", fontWeight: 600 }}>
                Total:
              </Text>
              <Text size="1" css={{ color: "$white", fontWeight: 700 }}>
                {stats.total}
              </Text>
            </Flex>
            <Flex css={{ alignItems: "center", gap: "$1" }}>
              <Box
                css={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "$sky11",
                }}
              />
              <Text size="1" css={{ color: "$neutral11" }}>
                For: {stats.for}
              </Text>
            </Flex>
            <Flex css={{ alignItems: "center", gap: "$1" }}>
              <Box
                css={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "$tomato11",
                }}
              />
              <Text size="1" css={{ color: "$neutral11" }}>
                Against: {stats.against}
              </Text>
            </Flex>
            <Flex css={{ alignItems: "center", gap: "$1" }}>
              <Box
                css={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "$neutral11",
                }}
              />
              <Text size="1" css={{ color: "$neutral11" }}>
                Abstain: {stats.abstain}
              </Text>
            </Flex>
          </Flex>
        )}
      </Box>
    );
  }, [stats, voter, ensName]);

  return (
    <VoteModal onClose={onClose} title="Voting History" header={summaryHeader}>
      {isLoading ? (
        <Flex
          css={{
            justifyContent: "center",
            alignItems: "center",
            height: "150px",
          }}
        >
          <Spinner />
        </Flex>
      ) : votes.length > 0 ? (
        <Box
          css={{
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              left: "7px",
              top: 0,
              bottom: 0,
              width: "2px",
              backgroundColor: "$neutral5",
              zIndex: 0,
            },
          }}
        >
          {votes.map((vote, idx) => (
            <Box
              key={vote.transactionHash ?? idx}
              css={{ position: "relative" }}
            >
              <VoteDetail vote={vote} />
            </Box>
          ))}
        </Box>
      ) : (
        <Text
          css={{ color: "$neutral11", textAlign: "center", marginTop: "$4" }}
        >
          No votes found for this voter.
        </Text>
      )}
    </VoteModal>
  );
};

export default Index;
