import { useQuery } from "@apollo/client";
import Spinner from "@components/Spinner";
import {
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
import dayjs from "dayjs";
import fm from "front-matter";
import { getLayout, LAYOUT_MAX_WIDTH } from "layouts/main";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { catIpfsJson, IpfsPoll } from "utils/ipfs";

import relativeTime from "dayjs/plugin/relativeTime";
import { usePollQuery, usePollsQuery } from "apollo";
dayjs.extend(relativeTime);

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
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data } = usePollsQuery({
    pollInterval,
  });

  useEffect(() => {
    if (data) {
      const pollArr = [];
      const init = async () => {
        if (!data.polls.length) {
          setLoading(false);
          return;
        }
        await Promise.all(
          data.polls.map(async (poll) => {
            const obj = await catIpfsJson<IpfsPoll>(poll?.proposal);

            // only include proposals with valid format
            if (obj?.text && obj?.gitCommitHash) {
              const transformedProposal = fm(obj.text) as any;
              if (
                !pollArr.filter(
                  (p) => p.attributes.lip === transformedProposal.attributes.lip
                ).length
              ) {
                pollArr.push({
                  ...poll,
                  ...transformedProposal,
                });
              }
            }
          })
        );
        setPolls(pollArr);
        setLoading(false);
      };
      init();
    }
  }, [data]);

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
                    passHref
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
                              {poll.attributes.title} (LIP {poll.attributes.lip}
                              )
                            </Heading>
                            <Box css={{ fontSize: "$1", color: "$neutral10" }}>
                              {!poll.isActive ? (
                                <Box>
                                  Voting ended on{" "}
                                  {dayjs
                                    .unix(poll.endTime)
                                    .format("MMM Do, YYYY")}
                                </Box>
                              ) : (
                                <Box>
                                  Voting ends in ~
                                  {dayjs()
                                    .add(poll.estimatedTimeRemaining, "seconds")
                                    .fromNow(true)}
                                </Box>
                              )}
                            </Box>
                          </Box>
                          <Status
                            color={poll.status}
                            css={{
                              fontWeight: 700,
                              textTransform: "capitalize",
                              "@bp2": {
                                mb: 0,
                              },
                            }}
                          >
                            {poll.status}
                          </Status>
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
