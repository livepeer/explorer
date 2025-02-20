import Spinner from "@components/Spinner";
import TransactionsList, {
  FILTERED_EVENT_TYPENAMES,
} from "@components/TransactionsList";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { getEvents } from "@lib/api/ssr";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { Box, Container, Flex, Heading } from "@livepeer/design-system";
import Head from "next/head";
import { useMemo } from "react";
import { EventsQueryResult, getApollo } from "../apollo";

const NUMBER_OF_PAGES = 20;
const TRANSACTIONS_PER_PAGE = 20;

const numberTransactions = NUMBER_OF_PAGES * TRANSACTIONS_PER_PAGE;

type PageProps = {
  events: EventsQueryResult["data"];
  fallback: { [key: string]: EnsIdentity };
};

const TransactionsPage = ({ events }: PageProps) => {
  const allEvents = useMemo(
    () =>
      events?.transactions
        ?.flatMap((transaction) => transaction.events)
        ?.filter((e) =>
          e?.__typename === "BondEvent"
            ? e?.additionalAmount !== "0.000000000000000001"
            : !FILTERED_EVENT_TYPENAMES.includes(e?.__typename ?? "")
        )
        ?.slice(0, numberTransactions) ?? [],
    [events]
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
            {!events ? (
              <Flex align="center" justify="center">
                <Spinner />
              </Flex>
            ) : (
              <TransactionsList
                events={allEvents as any}
                pageSize={TRANSACTIONS_PER_PAGE}
              />
            )}
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export const getStaticProps = async () => {
  const errorProps = {
    props: {},
    revalidate: 300,
  };
  try {
    const client = getApollo();
    const { events, fallback } = await getEvents(client, numberTransactions);

    if (!events.data) {
      return errorProps;
    }

    const props: PageProps = {
      events: events.data,
      fallback,
    };

    return {
      props,
      revalidate: 300,
    };
  } catch (e) {
    console.error(e);
  }

  return errorProps;
};

TransactionsPage.getLayout = getLayout;

export default TransactionsPage;
