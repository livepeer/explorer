import { ApolloError } from "@apollo/client";
import { useVoteEventsQuery, VoteEvent } from "apollo";
import { useEffect, useState } from "react";

const PAGE_SIZE = 500;

export function useGetAllVoteEvents(pollId: string) {
  const [allVoteEvents, setAllVoteEvents] = useState<VoteEvent[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorAll, setErrorAll] = useState<ApolloError | null>(null);

  const {
    data: voteEventsData,
    error,
    fetchMore,
  } = useVoteEventsQuery({
    variables: {
      where: { poll: pollId },
      first: PAGE_SIZE,
    },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (!voteEventsData) return;

    let isCancelled = false;

    async function loadAll() {
      try {
        let voteEvents = [...voteEventsData!.voteEvents];
        let lastTimestamp =
          voteEvents.length > 0
            ? voteEvents[voteEvents.length - 1].timestamp
            : null;

        while (voteEvents.length % PAGE_SIZE === 0 && lastTimestamp) {
          const { data: moreData } = await fetchMore({
            variables: {
              where: {
                poll: pollId,
                timestamp_lt: lastTimestamp,
              },
              first: PAGE_SIZE,
            },
          });

          const page = moreData?.voteEvents ?? [];
          if (page.length === 0) break;

          voteEvents = [...voteEvents, ...page];
          lastTimestamp = page[page.length - 1].timestamp;

          if (page.length < PAGE_SIZE) break;
        }

        if (!isCancelled) {
          setAllVoteEvents(voteEvents as VoteEvent[]);
          setLoadingAll(false);
        }
      } catch (err) {
        if (!isCancelled) {
          // setErrorAll(err);
          setErrorAll(
            err instanceof Error
              ? (err as ApolloError)
              : new ApolloError({ errorMessage: String(err) })
          );
          setLoadingAll(false);
        }
      }
    }

    loadAll();

    return () => {
      isCancelled = true;
    };
  }, [voteEventsData, fetchMore, pollId]);

  return {
    data: { voteEvents: allVoteEvents },
    loading: loadingAll,
    error: errorAll || error,
  };
}
