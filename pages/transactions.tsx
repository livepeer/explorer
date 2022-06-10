import { useQuery } from "@apollo/client";
import Spinner from "@components/Spinner";
import TransactionsList from "@components/TransactionsList";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { Box, Container, Flex, Heading } from "@livepeer/design-system";
import { getEvents } from "api";
import Head from "next/head";
import { eventsQuery } from "queries/eventsQuery";
import { useMemo } from "react";
import { getApollo } from "../apollo";

const NUMBER_OF_PAGES = 20;
const TRANSACTIONS_PER_PAGE = 20;

const numberTransactions = NUMBER_OF_PAGES * TRANSACTIONS_PER_PAGE;

const TransactionsPage = () => {
  const { data: eventsData, loading: eventsDataLoading } = useQuery(
    eventsQuery,
    { variables: { first: numberTransactions }, pollInterval: 30000 }
  );
  const allEvents = useMemo(
    () =>
      eventsData?.transactions
        ?.flatMap((transaction) => transaction.events)
        ?.slice(0, numberTransactions) ?? [],
    [eventsData]
  );
  const allIdentities = useMemo(
    () => eventsData?.transcoders.map((t) => t.identity) ?? [],
    [eventsData]
  );

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Transactions</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            mt: "$5",
            width: "100%",
          }}
        >
          <Flex align="center" css={{ mb: "$3" }}>
            <Heading size="2" as="h1" css={{ fontWeight: 700 }}>
              Transactions
            </Heading>
          </Flex>
          <Box css={{ mb: "$5" }}>
            {eventsDataLoading ? (
              <Flex align="center" justify="center">
                <Spinner />
              </Flex>
            ) : (
              <TransactionsList
                identities={allIdentities}
                events={allEvents}
                pageSize={TRANSACTIONS_PER_PAGE}
              />
            )}
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export async function getStaticProps() {
  const client = getApollo();
  await getEvents(client, numberTransactions);

  return {
    props: {
      initialApolloState: client.cache.extract(),
    },
    revalidate: 60,
  };
}

TransactionsPage.getLayout = getLayout;

export default TransactionsPage;
