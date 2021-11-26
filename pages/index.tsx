import { getLayout } from "@layouts/main";
import OrchestratorPayouts from "@components/OrchestratorPayouts";
import Link from "next/link";
import GlobalChart from "@components/GlobalChart";
import Flickity from "react-flickity-component";
import { Box, Flex, Heading, Container } from "@livepeer/design-system";
import Table from "@components/Table";
import { getOrchestrators } from "@lib/utils";

const Panel = ({ children }) => (
  <Flex
    css={{
      minHeight: 350,
      height: 350,
      position: "relative",
      bc: "$panel",
      p: "24px",
      marginRight: 16,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      border: "1px solid $colors$neutral4",
      width: "100%",
      "@bp2": {
        width: "43%",
      },
    }}
  >
    <Box css={{ borderColor: "$border" }} />
    {children}
  </Flex>
);

const Home = ({ orchestrators }) => {
  const flickityOptions = {
    wrapAround: true,
    cellAlign: "left",
    prevNextButtons: false,
  };

  return (
    <>
      <Container size="3" css={{ width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            mt: "$3",
            width: "100%",
            "@bp3": {
              mt: "$6",
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
          <Box
            css={{
              mb: "$7",
              boxShadow: "inset -20px 0px 20px -20px rgb(0 0 0 / 70%)",
              ".dot": {
                backgroundColor: "$neutral6",
              },
              ".dot.is-selected": {
                backgroundColor: "$primary",
              },
            }}
          >
            <Flickity
              className={"flickity"}
              elementType={"div"}
              options={flickityOptions}
              disableImagesLoaded={true} // default false
              reloadOnUpdate
              static
            >
              <Panel>
                <GlobalChart
                  display="volume"
                  title="Estimated Usage (7d)"
                  field="weeklyUsageMinutes"
                  unit="minutes"
                />
              </Panel>
              <Panel>
                <GlobalChart
                  display="volume"
                  title="Fee Volume (7d)"
                  field="weeklyVolumeUSD"
                  unit="usd"
                />
              </Panel>
              <Panel>
                <GlobalChart
                  display="area"
                  title="Participation"
                  field="participationRate"
                />
              </Panel>
            </Flickity>
          </Box>
          <Box css={{ mb: "$3" }}>
            <Flex
              css={{
                justifyContent: "space-between",
                mb: "$4",
                alignItems: "center",
              }}
            >
              <Heading size="1" css={{ fontWeight: 600 }}>
                Top Orchestrators
              </Heading>
              <Link href="/orchestrators" passHref>
                <Box as="a" css={{ color: "$white", fontSize: "$2", pr: "$3" }}>
                  See All
                </Box>
              </Link>
            </Flex>
            <Table data={orchestrators} />
          </Box>
          <Box>
            <Flex
              css={{
                justifyContent: "space-between",
                mb: "$2",
                alignItems: "center",
              }}
            >
              <Box as="h2" css={{ fontWeight: 500, fontSize: 18 }}>
                Orchestrator Payouts
              </Box>
            </Flex>
            <OrchestratorPayouts />
          </Box>
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

Home.getLayout = getLayout;

export default Home;
