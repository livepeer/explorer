import { NetworkStatus, useQuery } from "@apollo/client";
import Box from "../Box";
import { useEffect } from "react";
import Spinner from "../Spinner";
import { usePageVisibility } from "../../hooks";
import winningTicketsQuery from "../../queries/winningTicketsQuery.gql";
import Table from "./Table";

const Index = ({ pageSize = 10, title = "" }) => {
  const isVisible = usePageVisibility();
  const pollInterval = 20000;

  const variables = {
    orderBy: "timestamp",
    orderDirection: "desc",
  };

  const { data, networkStatus, startPolling, stopPolling } = useQuery(
    winningTicketsQuery,
    {
      variables,
      notifyOnNetworkStatusChange: true,
      pollInterval,
    }
  );

  useEffect(() => {
    if (!isVisible) {
      startPolling(pollInterval);
    } else {
      stopPolling();
    }
  }, [isVisible, startPolling, stopPolling]);

  return (
    <Box className="tour-step-6">
      {title && (
        <Box as="h2" css={{ fontWeight: 500, fontSize: 18, mb: "$3" }}>
          {title}
        </Box>
      )}
      <Box
        css={{
          position: "relative",
          pt: "$1",
          mb: "$4",
          minHeight: 500,
          width: "100%",
          backgroundColor: "$panel",
          borderRadius: "$4",
          border: "1px solid $neutral4",
        }}
      >
        {/* Show loading indicator if this is the first time time fetching or we're refetching
        https://github.com/apollographql/apollo-client/blob/main/src/core/networkStatus.ts */}
        {!data || networkStatus === NetworkStatus.refetch ? (
          <Box
            css={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              top: "calc(50%)",
              left: "50%",
              height: "500px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Spinner />
          </Box>
        ) : (
          <Box>
            <Table
              pageSize={pageSize}
              data={{
                tickets: data.tickets,
                currentRound: data.protocol.currentRound,
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Index;
