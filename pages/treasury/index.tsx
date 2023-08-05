import Spinner from "@components/Spinner";
import { Badge, Box, Button, Card, Container, Flex, Heading, Link as A, styled, Text } from "@livepeer/design-system";
import dayjs from "dayjs";
import { getLayout, LAYOUT_MAX_WIDTH } from "layouts/main";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useProtocolQuery } from "apollo";
import relativeTime from "dayjs/plugin/relativeTime";
import { useCurrentRoundData, useTreasuryProposalListData } from "hooks";
import TreasuryProposalRow from "@components/TreasuryProposalRow";
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
  const proposals = useTreasuryProposalListData();
  const protocol = useProtocolQuery();
  const currentRound = useCurrentRoundData();

  const isLoading = !proposals || !protocol?.data || !currentRound;

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Treasury</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%", mt: "$6" }}>
        {isLoading ? (
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
              <Link href="/voting/create-poll" as="/voting/create-poll" passHref>
                <Button size="3" variant="primary">
                  Create Proposal
                </Button>
              </Link>
            </Flex>
            {!proposals?.length && (
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
                  No proposals found.
                </Text>
              </Flex>
            )}
            <Box>
              {proposals
                ?.sort((a, b) => b.voteEnd - a.voteEnd)
                .map((prop) => (
                  <TreasuryProposalRow
                    key={prop.id}
                    proposal={prop}
                    currentRound={currentRound}
                    protocol={protocol.data ?? ({} as any)}
                  />
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
