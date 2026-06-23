import Spinner from "@components/Spinner";
import { POLL_VOTES } from "@lib/api/types/votes";
import { Badge, Box, Flex, Link, Text } from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { formatNumber } from "@utils/numberFormatters";
import { PollChoice, useVoteEventsQuery, VoteEvent } from "apollo";
import React from "react";

import TreasuryVoteHistoryModal from "../Treasury/TreasuryVoteTable/TreasuryVoteHistoryModal";
import PollVoteDetail from "./PollVoteDetail";

interface PollVotePopoverProps {
  voter: string;
  ensName?: string;
  onClose: () => void;
}

/**
 * Displays a voting history modal for a given voter, showing all their poll votes
 * sorted by timestamp with statistics (total, for, against) and vote event details.
 */
const Index: React.FC<PollVotePopoverProps> = ({ voter, ensName, onClose }) => {
  const {
    data: votesEventsData,
    loading: isLoading,
    error,
  } = useVoteEventsQuery({
    variables: {
      first: 200,
      where: {
        voter: voter,
      },
    },
  });

  const voteEvents = React.useMemo(() => {
    return votesEventsData?.voteEvents
      ? [...votesEventsData.voteEvents].sort(
          (a, b) => b.transaction.timestamp - a.transaction.timestamp
        )
      : [];
  }, [votesEventsData]);

  const stats = React.useMemo(() => {
    if (!voteEvents.length) return null;

    return {
      total: voteEvents.length,
      for: voteEvents.filter(
        (v) => v.choiceID === "0" || v.choiceID === PollChoice.Yes
      ).length,
      against: voteEvents.filter(
        (v) => v.choiceID === "1" || v.choiceID === PollChoice.No
      ).length,
    };
  }, [voteEvents]);

  const summaryHeader = React.useMemo(() => {
    return (
      <Box>
        <Flex
          css={{
            alignItems: "center",
            justifyContent: "space-between",
            gap: "$2",
            marginBottom: "$3",
            flexWrap: "wrap",
            "@bp2": { marginBottom: "$2", justifyContent: "flex-start" },
          }}
        >
          <Link
            href={`https://explorer.livepeer.org/accounts/${voter}/delegating`}
            target="_blank"
            rel="noopener noreferrer"
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
          {stats && (
            <Flex
              css={{
                alignItems: "center",
                gap: "$1",
                display: "flex",
                "@bp2": { display: "none" },
              }}
            >
              <Text size="1" css={{ color: "$neutral11", fontWeight: 600 }}>
                Total:
              </Text>
              <Text size="1" css={{ color: "$white", fontWeight: 700 }}>
                {formatNumber(stats.total, { precision: 0 })}
              </Text>
            </Flex>
          )}
        </Flex>
        {stats && (
          <Flex
            css={{
              gap: "$2",
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: "$2",
              "@bp2": { marginTop: 0 },
            }}
          >
            <Flex
              css={{
                alignItems: "center",
                gap: "$1",
                marginRight: "$2",
                display: "none",
                "@bp2": { display: "flex" },
              }}
            >
              <Text size="1" css={{ color: "$neutral11", fontWeight: 600 }}>
                Total:
              </Text>
              <Text size="1" css={{ color: "$white", fontWeight: 700 }}>
                {formatNumber(stats.total, { precision: 0 })}
              </Text>
            </Flex>
            <Badge
              size="1"
              css={{
                backgroundColor: POLL_VOTES.Yes.style.backgroundColor,
                color: POLL_VOTES.Yes.style.color,
                fontWeight: POLL_VOTES.Yes.style.fontWeight,
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "$1",
              }}
            >
              <Box
                as={POLL_VOTES.Yes.icon}
                css={{ width: 12, height: 12, flexShrink: 0 }}
              />
              For: {formatNumber(stats.for, { precision: 0 })}
            </Badge>
            <Badge
              size="1"
              css={{
                backgroundColor: POLL_VOTES.No.style.backgroundColor,
                color: POLL_VOTES.No.style.color,
                fontWeight: POLL_VOTES.No.style.fontWeight,
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "$1",
              }}
            >
              <Box
                as={POLL_VOTES.No.icon}
                css={{ width: 12, height: 12, flexShrink: 0 }}
              />
              Against: {formatNumber(stats.against, { precision: 0 })}
            </Badge>
          </Flex>
        )}
      </Box>
    );
  }, [stats, voter, ensName]);

  return (
    <TreasuryVoteHistoryModal
      onClose={onClose}
      title="Voting History"
      header={summaryHeader}
    >
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
      ) : error ? (
        <Text
          css={{ textAlign: "center", color: "$neutral11", marginTop: "$4" }}
        >
          {error.message}
        </Text>
      ) : voteEvents.length > 0 ? (
        <Flex
          css={{
            flexDirection: "column",
            gap: "$3",
            "@bp2": { gap: "$4" },
            position: "relative",
            "&::before": {
              "@bp2": {
                content: '""',
                position: "absolute",
                left: "7px",
                top: 0,
                bottom: 0,
                width: "2px",
                backgroundColor: "$neutral5",
                zIndex: 0,
              },
            },
          }}
        >
          {voteEvents.map((vote, idx) => (
            <Box
              key={vote.transaction.id ?? idx}
              css={{ position: "relative" }}
            >
              <PollVoteDetail vote={vote as VoteEvent} />
            </Box>
          ))}
        </Flex>
      ) : (
        <Text
          css={{ color: "$neutral11", textAlign: "center", marginTop: "$4" }}
        >
          No votes found for this voter.
        </Text>
      )}
    </TreasuryVoteHistoryModal>
  );
};

export default Index;
