import { ExplorerTooltip } from "@components/ExplorerTooltip";
import Spinner from "@components/Spinner";
import { Badge, Box, Flex, Link, Text } from "@livepeer/design-system";
import {
  ArrowTopRightIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import { CUBE_TYPE, getCubeData } from "cube/cube-client";
import { getAccountVotingHistory } from "cube/query-generator";
import { formatAddress } from "lib/utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Index = () => {
  const router = useRouter();
  const query = router.query;
  const account = query.account as string;

  const [proposalVotedOn, setProposalVotedOn] = useState();
  const [votingTurnOut, setVotingTurnOut] = useState();
  const [votingData, setVotingData] = useState();
  const [isLoading, setIsLoading] = useState(false);

  const getBackgroundColorByStatus = (status: string) => {
    let bgColor = "#212322";
    switch (status) {
      case "Active":
        bgColor = "#16271F";
        break;
      case "Defeated":
        bgColor = "#321C1D";
        break;
      case "Executed":
        bgColor = "#212322";
        break;
      default:
        break;
    }
    return bgColor;
  };

  const getTextStyleByStatus = (status: string) => {
    const stylesMap: Record<string, React.CSSProperties> = {
      Active: {
        color: "#51A7FD",
        backgroundColor: "#11233E",
        maxWidth: 80,
        justifyContent: "center",
        display: "flex",
        borderRadius: 8,
      },
      Defeated: {
        color: "#FF6468",
        backgroundColor: "#3C181A",
        maxWidth: 80,
        justifyContent: "center",
        display: "flex",
        borderRadius: 8,
      },
      Executed: {
        color: "#4ABF87",
        backgroundColor: "#10291E",
        maxWidth: 80,
        justifyContent: "center",
        display: "flex",
        borderRadius: 8,
      },
    };

    return stylesMap[status] || {}; // Returns styles if status is found, otherwise returns an empty object
  };

  useEffect(() => {
    const fetchingData = async () => {
      setIsLoading(true);
      try {
        const query = getAccountVotingHistory(account);
        const response = await getCubeData(query, { type: CUBE_TYPE.SERVER });
        const data = response?.[0]?.data;
        if (data.length > 0) {
          setVotingTurnOut(data[0]["LivepeerProposalStatus.votingTurnout"]);
          setProposalVotedOn(data[0]["LivepeerProposalStatus.proposalVotedOn"]);
          setVotingData(data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };
    fetchingData();
  }, [account]);

  const getDateTimeAndRound = (date: string, round: string): string => {
    // Parse the date string to a Date object
    const dateObj = new Date(date);

    // Function to format the date to "MM/DD/YYYY h:mm:ss a"
    const formatDate = (date: Date): string => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const ampm = hours >= 12 ? "pm" : "am";

      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const formattedTime = `${month} ${day}, ${year} ${hours % 12 || 12}:${
        minutes < 10 ? "0" + minutes : minutes
      }:${seconds < 10 ? "0" + seconds : seconds} ${ampm}`;

      return formattedTime;
    };

    // Round logic (In case the round value needs transformation, it's done here)
    const roundNumber = round.split("-")[0]; // Assuming round is in the format "3466-01-01T00:00:00.000", just using the first part

    // Format date
    const formattedDate = formatDate(dateObj);

    // Return the final output in the required format
    return `${formattedDate} - Round #${roundNumber}`;
  };

  if (isLoading) {
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
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "row", marginTop: 20 }}>
        <div
          style={{
            padding: 20,
            backgroundColor: "#191D1B",
            width: 300,
            marginRight: 15,
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div style={{ color: "#66736D", fontSize: 13 }}>
              PROPOSALS VOTED ON
            </div>
            <ExplorerTooltip
              multiline
              content={
                <Box>
                  The total number of governance proposals this orchestrator has
                  participated in by casting a vote.
                </Box>
              }
            >
              <Flex css={{ marginLeft: "$1" }}>
                <Box
                  as={QuestionMarkCircledIcon}
                  css={{ color: "$neutral11" }}
                />
              </Flex>
            </ExplorerTooltip>
          </div>
          <div style={{ fontSize: 27, marginTop: 6 }}>{proposalVotedOn}</div>
        </div>

        <div
          style={{
            padding: 20,
            backgroundColor: "#191D1B",
            width: 300,
            marginRight: 15,
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div style={{ color: "#66736D", fontSize: 13 }}>VOTING TURNOUT</div>
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
              <Flex css={{ marginLeft: "$1" }}>
                <Box
                  as={QuestionMarkCircledIcon}
                  css={{ color: "$neutral11" }}
                />
              </Flex>
            </ExplorerTooltip>
          </div>
          <div style={{ fontSize: 27, marginTop: 6 }}>{votingTurnOut}%</div>
        </div>
      </div>
      <Box css={{ marginTop: "$4" }}>
        {votingData &&
          // @ts-expect-error - votingData is an array of objects
          votingData.map((el, index) => {
            const status = el["LivepeerProposalStatus.status"];
            const statusStyle = getTextStyleByStatus(status);
            return (
              <Box
                key={index}
                css={{
                  padding: "$4",
                  backgroundColor: getBackgroundColorByStatus(status),
                  marginTop: "$3",
                  borderRadius: "$2",
                  transition: "all 0.2s ease",
                  "&:hover, &:focus-within": {
                    transform: "translateY(-2px)",
                    filter: "brightness(1.1)",
                  },
                }}
              >
                <Flex
                  css={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexDirection: "column",
                    "@bp2": { flexDirection: "row" },
                    gap: "$3",
                  }}
                >
                  <Box css={{ flex: 1 }}>
                    <Text
                      css={{
                        fontSize: "$3",
                        marginBottom: "$2",
                        fontWeight: 600,
                        color: "$white",
                        display: "block",
                      }}
                    >
                      {el["LivepeerProposalStatus.nameOfProposal"] ||
                        "Unknown Proposal"}
                    </Text>
                    <Flex
                      css={{
                        gap: "$3",
                        alignItems: "center",
                        marginBottom: "$2",
                      }}
                    >
                      <Text size="1" css={{ color: "$neutral11" }}>
                        {getDateTimeAndRound(
                          el["LivepeerProposalStatus.date"],
                          el["LivepeerProposalStatus.round"]
                        )}
                      </Text>
                      <Text size="1" css={{ color: "$neutral11" }}>
                        Proposed by{" "}
                        <Link
                          href={`https://explorer.livepeer.org/accounts/${el.orchestratorId}/delegating`}
                          css={{
                            color: "$primary11",
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                            "&:focus-visible": {
                              outline: "2px solid $primary11",
                              outlineOffset: "2px",
                              borderRadius: "2px",
                            },
                          }}
                        >
                          livepeer.eth
                        </Link>
                      </Text>
                    </Flex>
                  </Box>

                  <Flex
                    css={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      "@bp2": { alignItems: "flex-end" },
                      gap: "$2",
                      minWidth: 120,
                    }}
                  >
                    <Badge
                      css={{
                        color: statusStyle.color as string,
                        backgroundColor: statusStyle.backgroundColor as string,
                        fontWeight: 600,
                        padding: "$1 $2",
                        borderRadius: "$1",
                        fontSize: "10px",
                      }}
                    >
                      {status.toUpperCase()}
                    </Badge>

                    <Link
                      href={`https://explorer.livepeer.org/accounts/${el["LivepeerProposalStatus.voter"]}/delegating`}
                      css={{
                        textDecoration: "none",
                        fontSize: "$1",
                        color: "$neutral11",
                        display: "flex",
                        alignItems: "center",
                        gap: "$1",
                        "&:hover": { color: "$primary11" },
                        "&:focus-visible": {
                          outline: "2px solid $primary11",
                          outlineOffset: "2px",
                          borderRadius: "2px",
                          color: "$primary11",
                        },
                      }}
                    >
                      {formatAddress(el["LivepeerProposalStatus.voter"])}
                      <Box
                        as={ArrowTopRightIcon}
                        css={{ width: 12, height: 12 }}
                      />
                    </Link>
                  </Flex>
                </Flex>
              </Box>
            );
          })}
      </Box>
    </div>
  );
};

export default Index;
