import Spinner from "@components/Spinner";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
} from "@livepeer/design-system";
import { getLayout, LAYOUT_MAX_WIDTH } from "layouts/main";
import Head from "next/head";
import Link from "next/link";
import { useSnapshotProposals } from "hooks";
import SnapshotProposalRow from "@components/SnapshotProposalRow";

const Snapshots = () => {
  const { data: proposals, isLoading } = useSnapshotProposals("all");

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Snapshots</title>
      </Head>
      <Container
        css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%", marginTop: "$6" }}
      >
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
                marginBottom: "$5",
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
                Snapshots
              </Heading>
              <Link
                href="/snapshots/create-proposal"
                as="/snapshots/create-proposal"
                passHref
              >
                <Button size="3" variant="primary">
                  Create Snapshot
                </Button>
              </Link>
            </Flex>
            <Box css={{ marginBottom: "$3" }}>
              <Text size="3" variant="neutral">
                Community governance proposals via Snapshot. Vote on proposals
                to help shape the future of Livepeer.
              </Text>
            </Box>
            {!proposals?.length && (
              <Flex
                justify="center"
                css={{
                  borderRadius: "$4",
                  padding: "$6",
                  border: "1px dashed $neutral5",
                  marginTop: "$4",
                }}
              >
                <Text size="3" variant="neutral">
                  No proposals found.
                </Text>
              </Flex>
            )}
            <Box>
              {proposals?.map((prop) => (
                <SnapshotProposalRow key={prop.id} proposal={prop} />
              ))}
            </Box>
          </Flex>
        )}
      </Container>
    </>
  );
};

Snapshots.getLayout = getLayout;

export default Snapshots;
