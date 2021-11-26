import { getLayout } from "@layouts/main";
import Head from "next/head";
import { getOrchestrators } from "@lib/utils";
import { Box, Flex, Container } from "@livepeer/design-system";
import Table from "@components/Table";

const OrchestratorsPage = ({ orchestrators }) => {
  return (
    <>
      <Head>
        <title>Livepeer Explorer - Orchestrators</title>
      </Head>
      <Container size="3" css={{ width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            mt: "$4",
            width: "100%",
          }}
        >
          <Box
            as="h1"
            css={{
              fontSize: "$4",
              mb: "$4",
              fontWeight: 600,
              "@bp2": {
                fontSize: 26,
              },
            }}
          >
            Top Orchestrators
          </Box>
          <Table data={orchestrators} />
        </Flex>
      </Container>
    </>
  );
};

export async function getStaticProps() {
  const orchestrators = await getOrchestrators();

  return {
    props: {
      orchestrators: orchestrators.sort((a, b) =>
        +b.totalVolumeETH > +a.totalVolumeETH ? 1 : -1
      ),
    },
    revalidate: 1,
  };
}

OrchestratorsPage.getLayout = getLayout;

export default OrchestratorsPage;
