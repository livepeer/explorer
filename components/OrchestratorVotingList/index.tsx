import { ExplorerTooltip } from "@components/ExplorerTooltip";
import Table from "@components/Table";
import { formatAddress, textTruncate } from "@lib/utils";
import { Badge, Box, Flex, Link as A, Text } from "@livepeer/design-system";
import { CheckIcon, Cross2Icon, MinusIcon } from "@radix-ui/react-icons";
import { useEnsData } from "hooks";
import Link from "next/link";
import numbro from "numbro";
import QRCode from "qrcode.react";
import { useMemo } from "react";
import { Column } from "react-table";

export type VoterSummary = {
  id: string;
  noOfProposalsVotedOn: number;
  noOfVotesCasted: number;
  mostRecentVotes: (string | null)[];
  votingTurnout: number;
};

const OrchestratorVotingList = ({
  initialVoterData,
  pageSize = 10,
}: {
  initialVoterData?: VoterSummary[];
  pageSize: number;
}) => {
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
                      marginRight: "$2",
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

                  <Flex css={{ marginRight: "$2", alignItems: "center" }}>
                    {identity?.avatar ? (
                      <Box
                        as="img"
                        css={{
                          marginRight: "$2",
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
                          marginRight: "$2",
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
                      <Flex css={{ fontWeight: 600, alignItems: "center" }}>
                        <Box
                          css={{
                            marginRight: "$2",
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
                        {formatAddress(row.values.id)}
                      </Box>
                    )}
                  </Flex>
                </Flex>
              </A>
            </Link>
          );
        },
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The total number of governance proposals this orchestrator has
                participated in by casting a vote.
              </Box>
            }
          >
            <Box>Number of Proposals Voted On</Box>
          </ExplorerTooltip>
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
              {numbro(row.values.noOfProposalsVotedOn).format({
                mantissa: 0,
                thousandSeparated: true,
              })}
            </Text>
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The total count of individual votes submitted by this
                orchestrator across all proposals.
              </Box>
            }
          >
            <Box>Number of Votes Casted</Box>
          </ExplorerTooltip>
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
              {numbro(row.values.noOfVotesCasted).format({
                mantissa: 0,
                thousandSeparated: true,
              })}
            </Text>
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                A list of up to 5 of the orchestrator’s most recent votes,
                marked as [✓] for For, [✗] for Against, and [–] for Abstain.
              </Box>
            }
          >
            <Box>Most Recent Votes</Box>
          </ExplorerTooltip>
        ),
        accessor: "mostRecentVotes",
        Cell: ({ row }) => (
          <Box>
            <Flex css={{ alignItems: "center", gap: "$2" }}>
              {row.values.mostRecentVotes?.map((mostRecentVote, index) => {
                const icon =
                  mostRecentVote == "for" ? (
                    <CheckIcon style={{ color: "#1E1E1E" }} />
                  ) : mostRecentVote == "against" ? (
                    <Cross2Icon style={{ color: "#1E1E1E" }} />
                  ) : mostRecentVote == "abstain" ? (
                    <MinusIcon style={{ color: "#1E1E1E" }} />
                  ) : null;

                return (
                  <Box
                    css={{
                      backgroundColor:
                        mostRecentVote == "for"
                          ? "#357052"
                          : mostRecentVote == "against"
                          ? "#884140"
                          : mostRecentVote == "abstain"
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
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The percentage of total governance proposals this orchestrator
                voted on, showing how actively they participate in protocol
                decisions.
              </Box>
            }
          >
            <Box>Voting Turnout</Box>
          </ExplorerTooltip>
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
              {numbro(row.values.votingTurnout).format({
                output: "percent",
                mantissa: 2,
              })}
            </Text>
          </Box>
        ),
        sortType: "number",
      },
    ],
    []
  );
  if (initialVoterData) {
    return (
      <Table
        data={initialVoterData as VoterSummary[]}
        columns={columns as Column<VoterSummary>[]}
        initialState={{
          pageSize,
        }}
      />
    );
  } else {
    return null;
  }
};

export default OrchestratorVotingList;
