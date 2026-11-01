import Spinner from "@components/Spinner";
import { Flex, Text } from "@livepeer/design-system";
import { formatLPT, formatPercent } from "@utils/numberFormatters";
import { useTreasuryVoteEventsQuery, useTreasuryVotesQuery } from "apollo";
import React, { useMemo, useState } from "react";
import { useWindowSize } from "react-use";

import TreasuryVotePopover from "./TreasuryVotePopover";
import { DesktopVoteTable, Vote } from "./Views/DesktopVoteTable";
import { MobileVoteCards } from "./Views/MobileVoteTable";

interface TreasuryVoteTableProps {
  proposalId: string;
}

const useVotes = (proposalId: string) => {
  const {
    data: treasuryVotesData,
    loading,
    error,
  } = useTreasuryVotesQuery({
    variables: {
      where: {
        proposal: proposalId,
      },
    },
  });

  const {
    data: treasuryVoteEventsData,
    loading: treasuryVoteEventsLoading,
    error: treasuryVoteEventsError,
  } = useTreasuryVoteEventsQuery({
    variables: {
      first: 200,
      where: {
        proposal: proposalId,
      },
    },
  });

  const votesList = treasuryVotesData?.treasuryVotes;
  const eventsList = treasuryVoteEventsData?.treasuryVoteEvents;

  const votes = useMemo(() => {
    if (!votesList || !eventsList) {
      return [];
    }

    const latestEventByVoter = new Map<string, (typeof eventsList)[number]>();
    for (const event of eventsList) {
      const current = latestEventByVoter.get(event.voter.id);
      if (!current || event.timestamp > current.timestamp) {
        latestEventByVoter.set(event.voter.id, event);
      }
    }

    return votesList.map((vote) => {
      const latestEvent = latestEventByVoter.get(vote.voter.id);

      return {
        ...vote,
        reason: latestEvent?.reason || vote.reason || "",
        transactionHash: latestEvent?.transaction.id ?? "",
        timestamp: latestEvent?.timestamp,
      };
    }) as Vote[];
  }, [votesList, eventsList]);

  return {
    votes,
    loading: loading || treasuryVoteEventsLoading,
    error: error || treasuryVoteEventsError,
  };
};

const Index: React.FC<TreasuryVoteTableProps> = ({ proposalId }) => {
  const { width } = useWindowSize();
  const isDesktop = width >= 900;

  const [selectedVoter, setSelectedVoter] = useState<{
    address: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { votes, loading, error } = useVotes(proposalId);
  const totalWeight = useMemo(
    () => votes.reduce((sum, v) => sum + parseFloat(v.weight), 0),
    [votes]
  );

  const formatWeight = useMemo(
    () => (w: string) =>
      `${formatLPT(parseFloat(w), { abbreviate: false })} (${
        totalWeight > 0
          ? formatPercent(parseFloat(w) / totalWeight)
          : formatPercent(0)
      })`,
    [totalWeight]
  );

  const paginatedVotesForMobile = useMemo(() => {
    const sorted = [...votes].sort(
      (a, b) => parseFloat(b.weight) - parseFloat(a.weight)
    );
    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [votes, currentPage, pageSize]);

  const totalPages = Math.ceil(votes.length / pageSize);

  if (loading) {
    return (
      <Flex
        css={{
          justifyContent: "center",
          alignItems: "center",
          height: "150px",
        }}
      >
        <Spinner />
      </Flex>
    );
  }
  if (error)
    return (
      <Text css={{ textAlign: "center", color: "$red9", marginTop: "$4" }}>
        Error loading votes: {error.message}
      </Text>
    );

  if (!votes.length)
    return (
      <Text css={{ textAlign: "center", color: "$neutral11", marginTop: "$4" }}>
        No votes found for this proposal.
      </Text>
    );

  return (
    <>
      {isDesktop ? (
        <DesktopVoteTable
          votes={votes}
          formatWeight={formatWeight}
          onSelect={setSelectedVoter}
          pageSize={pageSize}
        />
      ) : (
        <MobileVoteCards
          votes={paginatedVotesForMobile}
          formatWeight={formatWeight}
          onSelect={setSelectedVoter}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
      {selectedVoter && (
        <TreasuryVotePopover
          voter={selectedVoter.address}
          onClose={() => setSelectedVoter(null)}
          formatWeight={formatWeight}
        />
      )}
    </>
  );
};

export default Index;
