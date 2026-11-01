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

// The subgraph returns at most 1000 delegators per request, so we load pages
// in chunks by increasing `skip` until a page is shorter than PAGE_SIZE.
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
    // Keep paging while the accumulated length is a full page; stop on short/empty
    // pages. Pause after failures until retry clears the flag.
    if (pageFetchFailed) return;
    if (!delegators?.length || delegators.length % PAGE_SIZE !== 0) return;
    fetchNext(delegators.length);
  }, [delegators, fetchNext, pageFetchFailed]);

  useEffect(() => {
    // Avoid render-time side effects.
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
