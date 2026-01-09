import Spinner from "@components/Spinner";
import { getEnsForVotes } from "@lib/api/ens";
import { formatAddress, lptFormatter } from "@lib/utils";
import { Flex, Text } from "@livepeer/design-system";
import { useTreasuryVoteEventsQuery, useTreasuryVotesQuery } from "apollo";
import React, { useEffect, useMemo, useState } from "react";
import { useWindowSize } from "react-use";

import VoterPopover from "../VotePopover";
import { DesktopVoteTable, Vote } from "./Views/DesktopVoteTable";
import { MobileVoteCards } from "./Views/MobileVoteTable";

interface VoteTableProps {
  proposalId: string;
}

const Index: React.FC<VoteTableProps> = ({ proposalId }) => {
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

  const { data: treasuryVoteEventsData } = useTreasuryVoteEventsQuery({
    variables: {
      where: {
        proposal: proposalId,
      },
    },
  });
  const { width } = useWindowSize();
  const isDesktop = width >= 768;

  const [selectedVoter, setSelectedVoter] = useState<{
    address: string;
    ensName?: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [votes, setVotes] = useState<Vote[]>([]);
  useEffect(() => {
    if (
      !treasuryVotesData?.treasuryVotes ||
      !treasuryVoteEventsData?.treasuryVoteEvents
    ) {
      setVotes([]);
    }
    const decorateVotes = async () => {
      const uniqueVoters = Array.from(
        new Set(treasuryVotesData?.treasuryVotes?.map((v) => v.voter.id) ?? [])
      );
      const localEnsCache: { [address: string]: string } = {};

      await Promise.all(
        uniqueVoters.map(async (address) => {
          try {
            if (localEnsCache[address]) {
              return;
            }
            const ensAddress = await getEnsForVotes(address);

            if (ensAddress && ensAddress.name) {
              localEnsCache[address] = ensAddress.name;
            } else {
              localEnsCache[address] = formatAddress(address);
            }
          } catch (e) {
            console.warn(`Failed to fetch ENS for ${address}`, e);
          }
        })
      );
      const votes =
        treasuryVotesData?.treasuryVotes?.map((vote) => {
          const voteEvent = treasuryVoteEventsData?.treasuryVoteEvents
            ?.filter((event) => event.voter.id === vote.voter.id)
            .slice()
            .sort((a, b) => b.timestamp - a.timestamp)
            .reverse()[0];
          const ensName = localEnsCache[vote.voter.id] ?? "";

          return {
            ...vote,
            ensName,
            transactionHash: voteEvent?.transaction.id ?? "",
          };
        }) ?? [];
      setVotes(votes as Vote[]);
    };
    decorateVotes();
  }, [
    treasuryVotesData?.treasuryVotes,
    treasuryVoteEventsData?.treasuryVoteEvents,
  ]);

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
        <VoterPopover
          voter={selectedVoter.address}
          ensName={selectedVoter.ensName}
          onClose={() => setSelectedVoter(null)}
        />
      )}
    </>
  );
};

export default Index;
