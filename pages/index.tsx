import "react-circular-progressbar/dist/styles.css";

import ErrorComponent from "@components/Error";
import TransactionsList, {
  FILTERED_EVENT_TYPENAMES,
} from "@components/TransactionsList";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { Box, Container, Flex, Heading } from "@livepeer/design-system";
import { useMemo } from "react";

import {
  EventsQueryResult,
  getApollo,
  OrchestratorsQueryResult,
  ProtocolQueryResult,
} from "../apollo";
import { getEvents, getOrchestrators, getProtocol } from "../lib/api/ssr";

type PageProps = {
  hadError: boolean;
  orchestrators: OrchestratorsQueryResult["data"] | null;
  events: EventsQueryResult["data"] | null;
  protocol: ProtocolQueryResult["data"] | null;
  fallback: { [key: string]: EnsIdentity };
};

const Home = ({ hadError, events }: PageProps) => {
  const allEvents = useMemo(
    () =>
      events?.transactions
        ?.flatMap((transaction) => transaction.events)
        ?.filter((e) =>
          e?.__typename === "BondEvent"
            ? e?.additionalAmount !== "0.000000000000000001"
            : !FILTERED_EVENT_TYPENAMES.includes(e?.__typename ?? "")
        )
        ?.slice(0, 100) ?? [],
    [events]
  );

  if (hadError) {
    return <ErrorComponent statusCode={500} />;
  }

  return (
    <>
      <Container css={{ maxWidth: 1400, width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            marginTop: "$3",
            width: "100%",
            "@bp3": {
              marginTop: "$6",
            },
          }}
        >
          <Heading
            as="h1"
            css={{
              color: "$hiContrast",
              fontSize: "$3",
              fontWeight: 600,
              mb: "$5",
              display: "none",
              alignItems: "center",
              "@bp2": {
                fontSize: "$7",
              },
              "@bp3": {
                display: "flex",
                fontSize: "$7",
              },
            }}
          >
            Overview
          </Heading>
          <Box css={{ marginBottom: "$3" }}>
            <Box>
              <TransactionsList
                events={
                  allEvents as NonNullable<
                    EventsQueryResult["data"]
                  >["transactions"][number]["events"]
                }
                pageSize={10}
              />
            </Box>
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export const getStaticProps = async () => {
  const errorProps: PageProps = {
    hadError: true,
    orchestrators: null,
    events: null,
    protocol: null,
    fallback: {},
  };

  try {
    const client = getApollo();
    const { orchestrators } = await getOrchestrators(client);
    const { events } = await getEvents(client);
    const protocol = await getProtocol(client);

    if (!orchestrators.data || !events.data || !protocol.data) {
      return {
        props: errorProps,
        revalidate: 60,
      };
    }

    const props: PageProps = {
      hadError: false,
      orchestrators: orchestrators.data,
      events: events.data,
      protocol: protocol.data,
      fallback: {},
    };

    return {
      props,
      revalidate: 120,
    };
  } catch (e) {
    console.error(e);
    return {
      props: errorProps,
      revalidate: 60,
    };
  }
};

export default Home;
