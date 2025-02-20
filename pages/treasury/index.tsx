import Spinner from "@components/Spinner";
import { Badge, Box, Card, Container, Flex, Heading, Link as A, styled, Text } from "@livepeer/design-system";
import { Button } from "@components/Button";
import dayjs from "dayjs";
import { getLayout, LAYOUT_MAX_WIDTH } from "layouts/main";
import Head from "next/head";
import Link from "next/link";
import { useProtocolQuery, useTreasuryProposalsQuery } from "apollo";
import relativeTime from "dayjs/plugin/relativeTime";
import { useCurrentRoundData } from "hooks";
import TreasuryProposalRow from "@components/TreasuryProposalRow";
import { parseProposalText } from "@lib/api/treasury";
import { useMemo } from "react";
dayjs.extend(relativeTime);

const pollInterval = 20000;

const Voting = () => {
  const protocol = useProtocolQuery();
  const currentRound = useCurrentRoundData();
  const { data } = useTreasuryProposalsQuery({ pollInterval });

  const proposals = useMemo(
    () => data?.treasuryProposals.map((p) => parseProposalText(p)),
    [data?.treasuryProposals]
  );

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
              <Link
                href="/treasury/create-proposal"
                as="/treasury/create-proposal"
                legacyBehavior
              >
                <Button size="3" color="green" css={{ cursor: "pointer" }}>
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
              {proposals?.map((prop) => (
                <TreasuryProposalRow
                  key={prop.id}
                  proposal={prop}
                  currentRound={currentRound}
                  protocol={protocol.data?.protocol}
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
