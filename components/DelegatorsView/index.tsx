import DelegatorList from "@components/DelegatorList";
import Spinner from "@components/Spinner";
import { Box, Button, Flex, Text } from "@livepeer/design-system";
import {
  AccountQueryResult,
  Delegator_OrderBy,
  OrderDirection,
  useOrchestratorDelegatorsQuery,
} from "apollo";
import { useCallback, useEffect, useRef, useState } from "react";

// The subgraph caps `delegators(first:)` at 1000 rows per request, so a single
// query silently drops delegators beyond the first 1000. Page through with
// `skip` until a short page comes back to load the complete list.
const PAGE_SIZE = 1000;

interface Props {
  transcoder?: NonNullable<AccountQueryResult["data"]>["transcoder"];
}

const DelegatorsView = ({ transcoder }: Props) => {
  const { data, loading, error, fetchMore } = useOrchestratorDelegatorsQuery({
    variables: {
      id: transcoder?.id ?? "",
      first: PAGE_SIZE,
      skip: 0,
      orderBy: Delegator_OrderBy.BondedAmount,
      orderDirection: OrderDirection.Desc,
    },
    skip: !transcoder?.id,
    notifyOnNetworkStatusChange: true,
  });

  const delegators = data?.transcoder?.delegators;

  // Set when a later page fails to load, so we can surface that the list is
  // incomplete (and pause auto-paging until the user retries).
  const [pageFetchFailed, setPageFetchFailed] = useState(false);

  // Concurrency lock (ref so it's synchronous) to avoid overlapping page fetches.
  const fetchingRef = useRef(false);
  const fetchNext = useCallback(
    async (skip: number) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setPageFetchFailed(false);
      try {
        await fetchMore({
          variables: { skip },
          updateQuery: (previousResult, { fetchMoreResult }) => {
            const next = fetchMoreResult?.transcoder?.delegators;
            if (!next?.length || !previousResult.transcoder) {
              return previousResult;
            }
            return {
              ...previousResult,
              transcoder: {
                ...previousResult.transcoder,
                delegators: [
                  ...(previousResult.transcoder.delegators ?? []),
                  ...next,
                ],
              },
            };
          },
        });
      } catch (e) {
        console.error("Failed to fetch additional delegators:", e);
        setPageFetchFailed(true);
      } finally {
        fetchingRef.current = false;
      }
    },
    [fetchMore]
  );

  useEffect(() => {
    // A full page implies there may be more; keep paging until a short page
    // (or an exact multiple returning an empty page) ends the loop. Pause while
    // a page fetch has failed so we don't hammer a failing endpoint; the retry
    // action clears the flag and re-runs this effect.
    if (pageFetchFailed) return;
    if (!delegators?.length || delegators.length % PAGE_SIZE !== 0) return;
    fetchNext(delegators.length);
  }, [delegators, fetchNext, pageFetchFailed]);

  useEffect(() => {
    // Log the initial-query failure as an after-render side effect rather than
    // during render (which can run twice or be discarded).
    if (error && !delegators) {
      console.error(error);
    }
  }, [error, delegators]);

  if (loading && !delegators) {
    return (
      <Flex
        css={{
          paddingTop: "$5",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner />
      </Flex>
    );
  }

  if (error && !delegators) {
    return (
      <Box
        css={{
          border: "1px solid $neutral4",
          borderRadius: "$4",
          padding: "$4",
          backgroundColor: "$neutral3",
          marginTop: "$4",
        }}
      >
        <Text>Unable to load delegators. Please try again later.</Text>
      </Box>
    );
  }

  return (
    <Box css={{ paddingTop: "$4" }}>
      {pageFetchFailed && (
        <Flex
          css={{
            alignItems: "center",
            justifyContent: "space-between",
            gap: "$3",
            border: "1px solid $neutral4",
            borderRadius: "$4",
            padding: "$3",
            marginBottom: "$3",
            backgroundColor: "$neutral3",
          }}
        >
          <Text size="2">
            Couldn&apos;t load all delegators — the list may be incomplete.
          </Text>
          <Button
            size="1"
            onClick={() => setPageFetchFailed(false)}
            css={{ flexShrink: 0 }}
          >
            Retry
          </Button>
        </Flex>
      )}
      <DelegatorList data={delegators} />
    </Box>
  );
};

export default DelegatorsView;
