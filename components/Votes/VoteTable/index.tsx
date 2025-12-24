import Spinner from "@components/Spinner";
import { lptFormatter } from "@lib/utils";
import { Flex, Text } from "@livepeer/design-system";
import React, { useMemo, useState } from "react";
import { useWindowSize } from "react-use";

import { useFetchVotes } from "../../../hooks/TreasuryVotes/useFetchVotes";
import VoterPopover from "../VotePopover";
import { DesktopVoteTable } from "./Views/DesktopVoteTable";
import { MobileVoteCards } from "./Views/MobileVoteTable";

interface VoteTableProps {
  proposalId: string;
}

const Index: React.FC<VoteTableProps> = ({ proposalId }) => {
  const { votes, loading, error } = useFetchVotes(proposalId);
  const { width } = useWindowSize();
  const isDesktop = width >= 768;

  const [selectedVoter, setSelectedVoter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalWeight = useMemo(
    () => votes.reduce((sum, v) => sum + parseFloat(v.weight), 0),
    [votes]
  );

  const formatWeight = useMemo(
    () => (w: string) =>
      `${lptFormatter.format(parseFloat(w) / 1e18)} LPT (${
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
        Error loading votes: {error}
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
        <VoterPopover
          voter={selectedVoter}
          onClose={() => setSelectedVoter(null)}
        />
      )}
    </>
  );
};

export default Index;
