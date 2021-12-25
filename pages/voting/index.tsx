import { getLayout } from "layouts/main";
import { useQuery } from "@apollo/client";
import Spinner from "@components/Spinner";
import IPFS from "ipfs-mini";
import fm from "front-matter";
import { useEffect, useState } from "react";
import moment from "moment";
import Link from "next/link";
import Head from "next/head";
import { usePageVisibility } from "../../hooks";
import { pollsQuery } from "core/queries/pollsQuery";
import {
  Container,
  Heading,
  Card,
  Box,
  Flex,
  Button,
  styled,
  Link as A,
} from "@livepeer/design-system";

export const Status = styled("div", {
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
  const isVisible = usePageVisibility();
  const pollInterval = 20000;
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data, startPolling, stopPolling } = useQuery(pollsQuery, {
    pollInterval,
  });

  useEffect(() => {
    if (!isVisible) {
      stopPolling();
    } else {
      startPolling(pollInterval);
    }
  }, [isVisible, startPolling, stopPolling]);

  useEffect(() => {
    if (data) {
      const ipfs = new IPFS({
        host: "ipfs.infura.io",
        port: 5001,
        protocol: "https",
      });
      const pollArr = [];
      const init = async () => {
        if (!data.polls.length) {
          setLoading(false);
          return;
        }
        await Promise.all(
          data.polls.map(async (poll) => {
            const obj = await ipfs.catJSON(poll.proposal);
            // only include proposals with valid format
            if (obj?.text && obj?.gitCommitHash) {
              const transformedProposal = fm(obj.text);
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
      <Container css={{ width: "100%", mt: "$6" }} size="3">
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
                                  {moment
                                    .unix(poll.endTime)
                                    .format("MMM Do, YYYY")}
                                </Box>
                              ) : (
                                <Box>
                                  Voting ends in ~
                                  {moment()
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
