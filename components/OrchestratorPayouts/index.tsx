import { NetworkStatus, useQuery } from "@apollo/client";
import Spinner from "@components/Spinner";
import { winningTicketsQuery } from "core/queries/winningTicketsQuery";
import Table from "@components/Table";
import { useMemo } from "react";
import Link from "next/link";
import { Flex, Box, Link as A } from "@livepeer/design-system";
import moment from "moment";

const Index = ({ title = "" }) => {
  const variables = {
    orderBy: "timestamp",
    orderDirection: "desc",
  };

  const { data, networkStatus, error } = useQuery(winningTicketsQuery, {
    variables,
    notifyOnNetworkStatusChange: true,
  });

  const columns: any = useMemo(
    () => [
      {
        Header: "Orchestrator",
        accessor: "recipient",
        Cell: ({ row }) => (
          <Link href={`/accounts/${row.values.recipient.id}/history`} passHref>
            <A>
              {row.values.recipient.id.replace(
                row.values.recipient.id.slice(5, 39),
                "…"
              )}
            </A>
          </Link>
        ),
      },
      {
        Header: "Amount",
        accessor: "faceValue",
        Cell: ({ row }) => (
          <Flex css={{ alignItems: "center" }}>
            <Flex
              css={{
                alignItems: "center",
                fontWeight: 600,
              }}
            >
              <Box>{parseFloat((+row.values.faceValue).toFixed(3))}</Box>{" "}
              <Box css={{ mx: "$1" }}>ETH</Box>
              <Box css={{ fontWeight: 400 }}>
                ({`$${parseFloat((+row.values.faceValueUSD).toFixed(2))}`})
              </Box>
            </Flex>
          </Flex>
        ),
      },
      {
        Header: "Value (USD)",
        accessor: "faceValueUSD",
      },
      {
        Header: "Transaction",
        accessor: "transaction",
      },
      {
        Header: "Broadcaster",
        accessor: "sender",
        Cell: ({ row }) => (
          <Link href={`/accounts/${row.values.sender.id}/history`} passHref>
            <A>
              {row.values.sender.id.replace(
                row.values.sender.id.slice(5, 39),
                "…"
              )}
            </A>
          </Link>
        ),
      },
      {
        Header: "Time",
        accessor: "timestamp",
        Cell: ({ row }) => (
          <A
            rel="noopener noreferrer"
            target="_blank"
            href={`https://etherscan.io/tx/${row.values.transaction.id}`}
          >
            {moment(row.values.timestamp * 1000).fromNow()}
          </A>
        ),
        sortType: "number",
      },
    ],
    []
  );

  return (
    <Box className="tour-step-6">
      {title && (
        <Box as="h2" css={{ fontWeight: 500, fontSize: 18, mb: "$3" }}>
          {title}
        </Box>
      )}
      <Box>
        {/* Show loading indicator if this is the first time time fetching or we're refetching
        https://github.com/apollographql/apollo-client/blob/main/src/core/networkStatus.ts */}
        {!data ? (
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
              data={data.tickets}
              columns={columns}
              initialState={{
                pageSize: 10,
                sortBy: [{ id: "timestamp", desc: true }],
                hiddenColumns: ["transaction", "faceValueUSD"],
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Index;
