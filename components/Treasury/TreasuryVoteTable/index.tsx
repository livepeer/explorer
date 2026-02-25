import Spinner from "@components/Spinner";
import { getEnsForVotes } from "@lib/api/ens";
import { formatAddress, lptFormatter } from "@lib/utils";
import { Flex, Text } from "@livepeer/design-system";
import { useTreasuryVoteEventsQuery, useTreasuryVotesQuery } from "apollo";
import React, { useEffect, useMemo, useState } from "react";
import { useWindowSize } from "react-use";

import TreasuryVotePopover from "./TreasuryVotePopover";
import { DesktopVoteTable, Vote } from "./Views/DesktopVoteTable";
import { MobileVoteCards } from "./Views/MobileVoteTable";

// Module-level cache to avoid repeated ENS lookups across renders/navigations.
// Bound size keeps memory usage predictable during long sessions.
const ENS_CACHE_MAX_ENTRIES = 2000;
const ensCache = new Map<string, string>();
const ensLookupInFlight = new Map<string, Promise<string>>();

const getCachedEns = (address: string) => {
  if (!ensCache.has(address)) return undefined;
  const cached = ensCache.get(address)!;

  // Refresh insertion order so frequently used addresses stay cached.
  ensCache.delete(address);
  ensCache.set(address, cached);

  return cached;
};

const setCachedEns = (address: string, ensName: string) => {
  if (ensCache.has(address)) {
    ensCache.delete(address);
  }
  ensCache.set(address, ensName);

  if (ensCache.size > ENS_CACHE_MAX_ENTRIES) {
    const oldestKey = ensCache.keys().next().value;
    if (oldestKey !== undefined) {
      ensCache.delete(oldestKey);
    }
  }
};

const resolveEnsName = (address: string): Promise<string> => {
  const cached = getCachedEns(address);
  if (cached) return Promise.resolve(cached);

  const inFlightLookup = ensLookupInFlight.get(address);
  if (inFlightLookup) return inFlightLookup;

  const lookupPromise = getEnsForVotes(address)
    .then((ensAddress) => {
      const ensName = ensAddress?.name || formatAddress(address);
      setCachedEns(address, ensName);
      return ensName;
    })
    .finally(() => {
      ensLookupInFlight.delete(address);
    });

  ensLookupInFlight.set(address, lookupPromise);
  return lookupPromise;
};

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
    fetchPolicy: "cache-and-network",
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
    fetchPolicy: "cache-and-network",
  });

  const [votes, setVotes] = useState<Vote[]>([]);
  const [votesLoading, setVotesLoading] = useState(false);
  useEffect(() => {
    if (
      !treasuryVotesData?.treasuryVotes ||
      !treasuryVoteEventsData?.treasuryVoteEvents
    ) {
      setVotes([]);
    }
    const decorateVotes = async () => {
      setVotesLoading(true);
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
            localEnsCache[address] = await resolveEnsName(address);
          } catch (e) {
            console.warn(`Failed to fetch ENS for ${address}`, e);
          }
        })
      );
      const votes =
        treasuryVotesData?.treasuryVotes?.map((vote) => {
          const events = (treasuryVoteEventsData?.treasuryVoteEvents ?? [])
            .filter((event) => event.voter.id === vote.voter.id)
            .sort((a, b) => b.timestamp - a.timestamp);

          const latestEvent = events[0];
          const ensName = localEnsCache[vote.voter.id] ?? "";

          return {
            ...vote,
            reason: latestEvent?.reason || vote.reason || "",
            ensName,
            transactionHash: latestEvent?.transaction.id ?? "",
            timestamp: latestEvent?.timestamp,
          };
        }) ?? [];
      setVotes(votes as Vote[]);
      setVotesLoading(false);
    };
    decorateVotes();
  }, [
    treasuryVotesData?.treasuryVotes,
    treasuryVoteEventsData?.treasuryVoteEvents,
  ]);

  return {
    votes,
    loading: loading || votesLoading || treasuryVoteEventsLoading,
    error: error || treasuryVoteEventsError,
  };
};

const Index: React.FC<TreasuryVoteTableProps> = ({ proposalId }) => {
  const { width } = useWindowSize();
  const isDesktop = width >= 900;

  const [selectedVoter, setSelectedVoter] = useState<{
    address: string;
    ensName?: string;
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
          ensName={selectedVoter.ensName}
          onClose={() => setSelectedVoter(null)}
          formatWeight={formatWeight}
        />
      )}
    </>
  );
};

export default Index;
