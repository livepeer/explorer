import Spinner from "@components/Spinner";
import { getEnsForVotes } from "@lib/api/ens";
import { Flex, Text } from "@livepeer/design-system";
import { formatAddress } from "@utils/web3";
import { PollChoice, usePollQuery, useVoteEventsQuery } from "apollo";
import React, { useEffect, useMemo, useState } from "react";
import { useWindowSize } from "react-use";

import { DesktopVoteTable } from "./DesktopVoteTable";
import { MobileVoteCards } from "./MobileVoteCards";
import PollVotePopover from "./PollVotePopover";

interface PollVotingTableProps {
  pollId: string;
}

export type PollVoteType = {
  __typename: "Vote";
  id: string;
  choiceID: PollChoice;
  voter: string;
  voteStake: string;
  nonVoteStake: string;
  ensName?: string;
  transactionHash: string;
  timestamp: number;
};

const useVotes = (pollId: string) => {
  const pollInterval = 10000;

  const {
    data: pollVotesData,
    loading,
    error: pollError,
  } = usePollQuery({
    variables: {
      id: pollId ?? "",
    },
    pollInterval,
  });

  const { data: pollVoteEventsData, error: pollVoteEventsError } =
    useVoteEventsQuery({
      variables: {
        first: 200,
        where: {
          poll: pollId,
        },
      },
    });

  const [votes, setVotes] = useState<PollVoteType[]>([]);
  const [votesLoading, setVotesLoading] = useState(false);

  useEffect(() => {
    if (!pollVotesData?.poll?.votes || !pollVoteEventsData?.voteEvents) {
      setVotes([]);
    }

    const decorateVotes = async () => {
      setVotesLoading(true);

      const uniqueVoters = Array.from(
        new Set(pollVotesData?.poll?.votes?.map((v) => v.voter) ?? [])
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
        pollVotesData?.poll?.votes?.map((vote) => {
          const events = (pollVoteEventsData?.voteEvents ?? [])
            .filter((event) => event.voter === vote.voter)
            .sort((a, b) => b.timestamp - a.timestamp);

          const latestEvent = events[0];
          const ensName = localEnsCache[vote.voter] ?? "";

          return {
            ...vote,
            ensName,
            transactionHash: latestEvent?.transaction.id ?? "",
            timestamp: latestEvent?.timestamp,
          };
        }) ?? [];

      setVotes(votes as PollVoteType[]);
      setVotesLoading(false);
    };

    decorateVotes();
  }, [pollVotesData?.poll?.votes, pollVoteEventsData?.voteEvents]);

  return {
    votes,
    loading: loading || votesLoading,
    error: pollError || pollVoteEventsError,
  };
};

const Index: React.FC<PollVotingTableProps> = ({ pollId }) => {
  const { width } = useWindowSize();
  const isDesktop = width >= 900;

  const [selectedVoter, setSelectedVoter] = useState<{
    address: string;
    ensName?: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { votes, loading } = useVotes(pollId);

  const paginatedVotesForMobile = useMemo(() => {
    const sorted = [...votes].sort((a, b) => b.timestamp - a.timestamp);
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

  if (!votes.length)
    return (
      <Text css={{ textAlign: "center", color: "$neutral11", marginTop: "$4" }}>
        No votes found for this poll.
      </Text>
    );

  return (
    <>
      {isDesktop ? (
        <DesktopVoteTable
          votes={votes}
          onSelect={setSelectedVoter}
          pageSize={pageSize}
        />
      ) : (
        <MobileVoteCards
          votes={paginatedVotesForMobile}
          onSelect={setSelectedVoter}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
      {selectedVoter && (
        <PollVotePopover
          voter={selectedVoter.address}
          ensName={selectedVoter.ensName}
          onClose={() => setSelectedVoter(null)}
        />
      )}
    </>
  );
};

export default Index;
