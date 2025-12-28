import GatewayList from "@components/GatewayList";
import { getLayout } from "@layouts/main";
import { getGateways } from "@lib/api/ssr";
import { Box, Container, Flex, Heading } from "@livepeer/design-system";
import { GatewaysQueryResult, getApollo } from "apollo";
import Head from "next/head";

type PageProps = {
  gateways: GatewaysQueryResult["data"];
};

const GatewaysPage = ({ gateways }: PageProps) => {
  return (
    <>
      <Head>
        <title>Livepeer Explorer - Gateways</title>
      </Head>
      <Container css={{ maxWidth: "", width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            marginTop: "$5",
            width: "100%",
          }}
        >
          <Flex
            align="center"
            css={{ marginBottom: "$3", justifyContent: "space-between" }}
          >
            <Heading size="2" as="h1" css={{ fontWeight: 700 }}>
              Gateways
            </Heading>
          </Flex>
          <Box css={{ marginBottom: "$5" }}>
            <GatewayList data={gateways?.gateways} pageSize={20} />
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export const getStaticProps = async () => {
  try {
    const client = getApollo();
    const { gateways } = await getGateways(client);

    if (!gateways.data) {
      return {
        notFound: true,
        revalidate: 300,
      };
    }

    const props: PageProps = {
      gateways: gateways.data,
    };

    return {
      props,
      revalidate: 1200,
    };
  } catch (e) {
    console.error(e);
  }

  return {
    notFound: true,
    revalidate: 300,
  };
};

GatewaysPage.getLayout = getLayout;

export default GatewaysPage;
