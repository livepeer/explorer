import Spinner from "@components/Spinner";
import { lptFormatter } from "@lib/utils";
import { Flex, Text } from "@livepeer/design-system";
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

  const votes = useMemo(() => {
    const votesList = treasuryVotesData?.treasuryVotes;
    const eventsList = treasuryVoteEventsData?.treasuryVoteEvents;

    if (!votesList || !eventsList) {
      return [];
    }

    return votesList.map((vote) => {
      const events = eventsList
        .filter((event) => event.voter.id === vote.voter.id)
        .sort((a, b) => b.timestamp - a.timestamp);

      const latestEvent = events[0];

      return {
        ...vote,
        reason: latestEvent?.reason || vote.reason || "",
        transactionHash: latestEvent?.transaction.id ?? "",
        timestamp: latestEvent?.timestamp,
      };
    }) as Vote[];
  }, [treasuryVotesData, treasuryVoteEventsData]);

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
      `${lptFormatter.format(parseFloat(w))} LPT (${
        totalWeight > 0 ? ((parseFloat(w) / totalWeight) * 100).toFixed(2) : "0"
      }%)`,
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
