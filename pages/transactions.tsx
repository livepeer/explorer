import ErrorComponent from "@components/Error";
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
  hadError: boolean;
  events: EventsQueryResult["data"] | null;
  fallback: { [key: string]: EnsIdentity };
};

const TransactionsPage = ({ hadError, events }: PageProps) => {
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

  if (hadError) {
    return <ErrorComponent statusCode={500} />;
  }

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Transactions</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            marginTop: "$5",
            width: "100%",
          }}
        >
          <Flex align="center" css={{ marginBottom: "$3" }}>
            <Heading size="2" as="h1" css={{ fontWeight: 700 }}>
              Transactions
            </Heading>
          </Flex>
          <Box css={{ marginBottom: "$5" }}>
            {!events ? (
              <Flex align="center" justify="center">
                <Spinner />
              </Flex>
            ) : (
              <TransactionsList
                events={
                  allEvents as NonNullable<
                    EventsQueryResult["data"]
                  >["transactions"][number]["events"]
                }
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
  const errorProps: PageProps = {
    hadError: true,
    events: null,
    fallback: {},
  };

  try {
    const client = getApollo();
    const { events, fallback } = await getEvents(client, numberTransactions);

    if (!events.data) {
      return {
        props: errorProps,
        revalidate: 60,
      };
    }

    const props: PageProps = {
      hadError: false,
      events: events.data,
      fallback,
    };

    return {
      props,
      revalidate: 300,
    };
  } catch (e) {
    console.error(e);
    return {
      props: errorProps,
      revalidate: 60,
    };
  }
};

TransactionsPage.getLayout = getLayout;

export default TransactionsPage;
