import Spinner from "@components/Spinner";
import VoteDetail from "@components/Votes/VoteDetail";
import VoteModal from "@components/Votes/VoteHistoryModal";
import { TREASURY_VOTES } from "@lib/api/types/votes";
import { Badge, Box, Flex, Link, Text } from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import {
  TreasuryVoteEvent,
  TreasuryVoteSupport,
  useTreasuryVoteEventsQuery,
} from "apollo";
import React from "react";

interface VoterPopoverProps {
  voter: string;
  ensName?: string;
  onClose: () => void;
  formatWeight: (weight: string) => string;
}

const Index: React.FC<VoterPopoverProps> = ({
  voter,
  ensName,
  onClose,
  formatWeight,
}) => {
  const { data: votesData, loading: isLoading } = useTreasuryVoteEventsQuery({
    variables: {
      where: {
        voter: voter,
      },
    },
  });

  const votes = React.useMemo(() => {
    return votesData?.treasuryVoteEvents
      ? [...votesData.treasuryVoteEvents].sort(
          (a, b) => b.transaction.timestamp - a.transaction.timestamp
        )
      : [];
  }, [votesData]);

  const stats = React.useMemo(() => {
    if (!votes.length) return null;
    return {
      total: votes.length,
      for: votes.filter((v) => v.support === TreasuryVoteSupport.For).length,
      against: votes.filter((v) => v.support === TreasuryVoteSupport.Against)
        .length,
      abstain: votes.filter((v) => v.support === TreasuryVoteSupport.Abstain)
        .length,
    };
  }, [votes]);

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
                {stats.total}
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
                {stats.total}
              </Text>
            </Flex>
            <Badge
              size="1"
              css={{
                backgroundColor: TREASURY_VOTES.for.style.backgroundColor,
                color: TREASURY_VOTES.for.style.color,
                fontWeight: TREASURY_VOTES.for.style.fontWeight,
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "$1",
              }}
            >
              <Box
                as={TREASURY_VOTES.for.icon}
                css={{ width: 12, height: 12, flexShrink: 0 }}
              />
              For: {stats.for}
            </Badge>
            <Badge
              size="1"
              css={{
                backgroundColor: TREASURY_VOTES.against.style.backgroundColor,
                color: TREASURY_VOTES.against.style.color,
                fontWeight: TREASURY_VOTES.against.style.fontWeight,
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "$1",
              }}
            >
              <Box
                as={TREASURY_VOTES.against.icon}
                css={{ width: 12, height: 12, flexShrink: 0 }}
              />
              Against: {stats.against}
            </Badge>
            <Badge
              size="1"
              css={{
                backgroundColor: TREASURY_VOTES.abstain.style.backgroundColor,
                color: TREASURY_VOTES.abstain.style.color,
                fontWeight: TREASURY_VOTES.abstain.style.fontWeight,
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "$1",
              }}
            >
              <Box
                as={TREASURY_VOTES.abstain.icon}
                css={{ width: 12, height: 12, flexShrink: 0 }}
              />
              Abstain: {stats.abstain}
            </Badge>
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
          {votes.map((vote, idx) => (
            <Box
              key={vote.transaction.id ?? idx}
              css={{ position: "relative" }}
            >
              <VoteDetail
                vote={vote as TreasuryVoteEvent}
                formatWeight={formatWeight}
              />
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
    </VoteModal>
  );
};

export default Index;
