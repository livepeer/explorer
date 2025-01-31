import Table from "@components/Table";
import { textTruncate } from "@lib/utils";
import { Badge, Box, Flex, Link as A, Text } from "@livepeer/design-system";
import { CheckIcon, Cross2Icon, MinusIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import numeral from "numeral";
import QRCode from "qrcode.react";
import { useMemo } from "react";

import { ExplorerTooltip } from "@components/ExplorerTooltip";
import { useEnsData } from "hooks";

const OrchestratorVotingList = ({
  data,
  pageSize = 10,
}: {
  pageSize: number;
  data: any;
}) => {
  data = [
    {
      id: "0x75fbf65a3dfe93545c9768f163e59a02daf08d36",
      noOfProposalsVotedOn: 200,
      noOfVotesCasted: 100,
      mostRecentVotes: [true, false, false, true, null],
      votingTurnout: 0.5,
    },
    {
      id: "0x75fbf65a3dfe93545c9768f163e59a02daf08d36",
      noOfProposalsVotedOn: 200,
      noOfVotesCasted: 100,
      mostRecentVotes: [true, false, false, true, null],
      votingTurnout: 0.5,
    },
    {
      id: "0x75fbf65a3dfe93545c9768f163e59a02daf08d36",
      noOfProposalsVotedOn: 200,
      noOfVotesCasted: 100,
      mostRecentVotes: [true, false, false, true, null],
      votingTurnout: 0.5,
    },
  ];
  pageSize = 2;

  const mappedData = useMemo(() => {
    return data?.map((row) => {
      return {
        ...row,
      };
    });
  }, [data]);

  const columns = useMemo(
    () => [
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The account which is actively coordinating transcoders and
                receiving fees/rewards.
              </Box>
            }
          >
            <Box
              css={{
                height: 20,
                display: "flex",
                alignItems: "center",
              }}
            >
              Orchestrator
            </Box>
          </ExplorerTooltip>
        ),
        accessor: "id",
        Cell: ({ row }) => {
          const identity = useEnsData(row.values.id);

          return (
            <Link href={`/accounts/${row.values.id}/orchestrating`} passHref>
              <A
                css={{
                  width: 350,
                  display: "block",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "none" },
                }}
              >
                <Flex css={{ alignItems: "center" }}>
                  <Box
                    css={{
                      mr: "$2",
                      backgroundColor: "$neutral4",
                      borderRadius: 1000,
                      color: "$neutral11",
                      fontWeight: 700,
                      width: 24,
                      height: 24,
                      minWidth: 24,
                      minHeight: 24,
                      fontSize: 11,
                      justifyContent: "center",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {+row.id + 1}
                  </Box>

                  <Flex css={{ mr: "$2", alignItems: "center" }}>
                    {identity?.avatar ? (
                      <Box
                        as="img"
                        css={{
                          mr: "$2",
                          width: 24,
                          height: 24,
                          maxWidth: 24,
                          maxHeight: 24,
                          borderRadius: 1000,
                        }}
                        src={identity.avatar}
                      />
                    ) : (
                      <Box
                        as={QRCode}
                        css={{
                          mr: "$2",
                          borderRadius: 1000,
                          width: 24,
                          height: 24,
                          maxWidth: 24,
                          maxHeight: 24,
                        }}
                        fgColor={`#${row.values.id.substr(2, 6)}`}
                        value={row.values.id}
                      />
                    )}
                    {identity?.name ? (
                      <Flex css={{ fontWeight: 600, ai: "center" }}>
                        <Box
                          css={{
                            mr: "$2",
                            fontSize: "$3",
                          }}
                        >
                          {textTruncate(identity.name, 20, "…")}
                        </Box>
                        <Badge size="2" css={{ fontSize: "$2" }}>
                          {row.values.id.substring(0, 6)}
                        </Badge>
                      </Flex>
                    ) : (
                      <Box css={{ fontWeight: 600 }}>
                        {row.values.id.replace(row.values.id.slice(7, 37), "…")}
                      </Box>
                    )}
                    {/* {(row?.original?.daysSinceChangeParams ??
                      Number.MAX_VALUE) < 30 && (
                      <ExplorerTooltip
                        multiline
                        content={`This orchestrator changed their fee or reward cut ${row?.original?.daysSinceChangeParamsFormatted}.`}
                      >
                        <Box>
                          <Box
                            as={ExclamationTriangleIcon}
                            css={{ ml: "$2", color: "$neutral11" }}
                          />
                        </Box>
                      </ExplorerTooltip>
                    )} */}
                  </Flex>
                </Flex>
              </A>
            </Link>
          );
        },
      },
      {
        Header: (
          // <ExplorerTooltip
          //   multiline
          //   content={<Box>{/* tooltip content here */}</Box>}
          // >
          <Box
            css={{
              height: 20,
              display: "flex",
              alignItems: "center",
            }}
          >
            Number of Proposals Voted On
          </Box>
          // </ExplorerTooltip>
        ),
        accessor: "noOfProposalsVotedOn",
        Cell: ({ row }) => (
          <Box>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              {numeral(row.values.noOfProposalsVotedOn).format("0,0")}
            </Text>
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: (
          // <ExplorerTooltip
          //   multiline
          //   content={<Box>{/* tooltip content here */}</Box>}
          // >
          <Box
            css={{
              height: 20,
              display: "flex",
              alignItems: "center",
            }}
          >
            Number of Votes Casted
          </Box>
          // </ExplorerTooltip>
        ),
        accessor: "noOfVotesCasted",
        Cell: ({ row }) => (
          <Box>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              {numeral(row.values.noOfVotesCasted).format("0,0")}
            </Text>
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: (
          // <ExplorerTooltip
          //   multiline
          //   content={<Box>{/* tooltip content here */}</Box>}
          // >
          <Box
            css={{
              height: 20,
              display: "flex",
              alignItems: "center",
            }}
          >
            Most Recent Votes
          </Box>
          // </ExplorerTooltip>
        ),
        accessor: "mostRecentVotes",
        Cell: ({ row }) => (
          <Box>
            <Flex css={{ alignItems: "center", gap: "$2" }}>
              {row.values.mostRecentVotes?.map((mostRecentVote, index) => {
                let icon =
                  mostRecentVote === true ? (
                    <CheckIcon style={{ color: "#1E1E1E" }} />
                  ) : mostRecentVote === false ? (
                    <Cross2Icon style={{ color: "#1E1E1E" }} />
                  ) : mostRecentVote === null ? (
                    <MinusIcon style={{ color: "#1E1E1E" }} />
                  ) : null;

                return (
                  <Box
                    css={{
                      backgroundColor:
                        mostRecentVote === true
                          ? "#357052"
                          : mostRecentVote === false
                          ? "#884140"
                          : mostRecentVote === null
                          ? "#5F5F5F"
                          : "",
                      borderRadius: 1000,
                      width: 24,
                      height: 24,
                      minWidth: 24,
                      minHeight: 24,
                      justifyContent: "center",
                      display: "flex",
                      alignItems: "center",
                    }}
                    key={index}
                  >
                    {icon}
                  </Box>
                );
              })}
            </Flex>
          </Box>
        ),
      },
      {
        Header: (
          // <ExplorerTooltip
          //   multiline
          //   content={<Box>{/* tooltip content here */}</Box>}
          // >
          <Box
            css={{
              height: 20,
              display: "flex",
              alignItems: "center",
            }}
          >
            Voting Turnout
          </Box>
          // </ExplorerTooltip>
        ),
        accessor: "votingTurnout",
        Cell: ({ row }) => (
          <Box>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              {numeral(row.values.votingTurnout).format("0.0%")}
            </Text>
          </Box>
        ),
        sortType: "number",
      },
    ],
    []
  );

  return (
    <Table
      data={mappedData as any}
      columns={columns as any}
      initialState={{
        pageSize,
      }}
    />
  );
};

export default OrchestratorVotingList;
