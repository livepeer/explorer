import Spinner from "@components/Spinner";
import { getPollExtended, PollExtended } from "@lib/api/polls";
import dayjs from "@lib/dayjs";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Link as A,
  styled,
  Text,
} from "@livepeer/design-system";
import { usePollsQuery } from "apollo";
import { sentenceCase } from "change-case";
import { useCurrentRoundData } from "hooks";
import { LAYOUT_MAX_WIDTH } from "layouts/constants";
import { getLayout } from "layouts/main";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

export const Status = styled("div", {
  length: {},
  variants: {
    color: {
      passed: {
        color: "$primary",
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
      <Container
        css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%", marginTop: "$6" }}
      >
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
                marginBottom: "$5",
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
                passHref
              >
                <Button size="3" variant="primary">
                  Create Poll
                </Button>
              </Link>
            </Flex>
            {!polls.length && (
              <Flex
                justify="center"
                css={{
                  borderRadius: "$4",
                  padding: "$6",
                  border: "1px dashed $neutral5",
                  marginTop: "$4",
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
                  <A
                    as={Link}
                    key={poll.id}
                    href={`/voting/${poll.id}`}
                    passHref
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
                        padding: "$4",
                        marginBottom: "$3",
                        border: "1px solid $neutral4",
                      }}
                    >
                      <Flex
                        css={{
                          flexDirection: "column-reverse",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "$2",
                          "@bp2": {
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 0,
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
                              ? "primary"
                              : "neutral"
                          }
                          css={{
                            textTransform: "capitalize",
                            fontWeight: 700,
                            marginLeft: "-$1",
                            marginBottom: "$1",
                            "@bp2": { marginLeft: 0, marginBottom: 0 },
                          }}
                        >
                          {sentenceCase(poll.status)}
                        </Badge>
                      </Flex>
                    </Card>
                  </A>
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
