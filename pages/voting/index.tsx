import Spinner from "@components/Spinner";
import {
  Badge,
  Box,
  Card,
  Container,
  Flex,
  Heading,
  Link as A,
  styled,
  Text,
} from "@jjasonn.stone/design-system";
import { Button } from "@components/Button";
import dayjs from "dayjs";
import { getLayout, LAYOUT_MAX_WIDTH } from "layouts/main";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPollExtended, PollExtended } from "@lib/api/polls";
import { usePollsQuery } from "apollo";
import relativeTime from "dayjs/plugin/relativeTime";
import { useCurrentRoundData } from "hooks";
import { sentenceCase } from "change-case";
dayjs.extend(relativeTime);

export const Status = styled("div", {
  length: {},
  variants: {
    color: {
      passed: {
        color: "$green",
      },
      rejected: {
        color: "$red",
      },
      active: {
        color: "$white",
      },
    },
  },
});

const Voting = () => {
  const pollInterval = 20000;
  const [polls, setPolls] = useState<PollExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const { data } = usePollsQuery({
    pollInterval,
  });

  const currentRound = useCurrentRoundData();

  useEffect(() => {
    if (data && currentRound?.currentL1Block) {
      const init = async () => {
        setPolls(
          await Promise.all(
            (data?.polls ?? []).map((p) =>
              getPollExtended(p, currentRound.currentL1Block)
            )
          )
        );

        setLoading(false);
      };
      init();
    }
  }, [data, currentRound?.currentL1Block]);

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Voting</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%", mt: "$6" }}>
        {loading ? (
          <Flex
            css={{
              height: "calc(100vh - 100px)",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              "@bp3": {
                height: "100vh",
              },
            }}
          >
            <Spinner />
          </Flex>
        ) : (
          <Flex
            css={{
              width: "100%",
              flexDirection: "column",
            }}
          >
            <Flex
              css={{
                alignItems: "center",
                justifyContent: "space-between",
                mb: "$5",
              }}
            >
              <Heading
                size="2"
                css={{
                  fontWeight: 700,
                  m: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Voting
              </Heading>
              <Link
                href="/voting/create-poll"
                as="/voting/create-poll"
                legacyBehavior
              >
                <Button size="3" color="green">
                  Create Poll
                </Button>
              </Link>
            </Flex>
            {!polls.length && (
              <Flex
                justify="center"
                css={{
                  borderRadius: "$4",
                  p: "$6",
                  border: "1px dashed $neutral5",
                  mt: "$4",
                }}
              >
                <Text size="3" variant="neutral">
                  No polls found.
                </Text>
              </Flex>
            )}
            <Box>
              {polls
                .sort((a, b) => (a.endBlock < b.endBlock ? 1 : -1))
                .map((poll) => (
                  <Link
                    key={poll.id}
                    href="/voting/[poll]"
                    as={`/voting/${poll.id}`}
                    legacyBehavior
                  >
                    <A
                      css={{
                        cursor: "pointer",
                        display: "block",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "none" },
                      }}
                    >
                      <Card
                        variant="interactive"
                        css={{
                          p: "$4",
                          mb: "$3",
                          border: "1px solid $neutral4",
                        }}
                      >
                        <Flex
                          css={{
                            flexDirection: "column-reverse",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            "@bp2": {
                              flexDirection: "row",
                              alignItems: "center",
                            },
                          }}
                        >
                          <Box>
                            <Heading size="1" css={{ mb: "$1" }}>
                              {poll.attributes?.title} (LIP {poll.attributes?.lip}
                              )
                            </Heading>
                            <Box css={{ fontSize: "$1", color: "$neutral10" }}>
                              {poll.status !== "active" ? (
                                <Box>
                                  Voting ended on{" "}
                                  {dayjs
                                    .unix(poll.estimatedEndTime)
                                    .format("MMM D, YYYY")}
                                </Box>
                              ) : (
                                <Box>
                                  Voting ends in ~
                                  {dayjs
                                    .unix(poll.estimatedEndTime)
                                    .fromNow(true)}
                                </Box>
                              )}
                            </Box>
                          </Box>
                          <Badge
                            size="2"
                            variant={
                              poll.status === "rejected"
                                ? "red"
                                : poll.status === "active"
                                ? "blue"
                                : poll.status === "passed"
                                ? "green"
                                : "neutral"
                            }
                            css={{
                              textTransform: "capitalize",
                              fontWeight: 700,
                            }}
                          >
                            {sentenceCase(poll.status)}
                          </Badge>
                        </Flex>
                      </Card>
                    </A>
                  </Link>
                ))}
            </Box>
          </Flex>
        )}
      </Container>
    </>
  );
};

Voting.getLayout = getLayout;

export default Voting;
