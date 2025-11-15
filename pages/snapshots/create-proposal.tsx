import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Link as A,
} from "@livepeer/design-system";
import { getLayout, LAYOUT_MAX_WIDTH } from "layouts/main";
import Head from "next/head";
import { ArrowTopRightIcon } from "@modulz/radix-icons";

const CreateSnapshotProposal = () => {
  const SNAPSHOT_SPACE = process.env.NEXT_PUBLIC_SNAPSHOT_SPACE || "livepeer.eth";
  const snapshotUrl = `https://snapshot.org/#/${SNAPSHOT_SPACE}`;

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Create Snapshot Proposal</title>
      </Head>
      <Container
        css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%", marginTop: "$6" }}
      >
        <Flex
          css={{
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
          }}
        >
          <Heading
            size="2"
            css={{
              fontWeight: 700,
              marginBottom: "$4",
              textAlign: "center",
            }}
          >
            Create a Snapshot Proposal
          </Heading>

          <Text
            size="4"
            variant="neutral"
            css={{
              marginBottom: "$5",
              textAlign: "center",
              maxWidth: "600px",
            }}
          >
            To create a new Snapshot proposal for the Livepeer community, please
            visit the official Snapshot space.
          </Text>

          <Box css={{ marginBottom: "$4" }}>
            <A
              href={snapshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              css={{ textDecoration: "none" }}
            >
              <Button size="4" variant="primary">
                <Flex css={{ alignItems: "center", gap: "$2" }}>
                  Go to Snapshot
                  <Box
                    as={ArrowTopRightIcon}
                    css={{
                      width: 20,
                      height: 20,
                    }}
                  />
                </Flex>
              </Button>
            </A>
          </Box>

          <Box
            css={{
              marginTop: "$5",
              padding: "$4",
              backgroundColor: "$panel",
              borderRadius: "$4",
              border: "1px solid $neutral4",
              maxWidth: "600px",
            }}
          >
            <Heading size="1" css={{ marginBottom: "$3", fontWeight: 600 }}>
              Requirements
            </Heading>
            <Text size="3" variant="neutral" css={{ lineHeight: 1.6 }}>
              • You must have sufficient voting power in the Livepeer protocol
              <br />
              • Connect your wallet on Snapshot.org
              <br />
              • Follow the Snapshot proposal guidelines
              <br />• Proposals should be relevant to the Livepeer community
            </Text>
          </Box>
        </Flex>
      </Container>
    </>
  );
};

CreateSnapshotProposal.getLayout = getLayout;

export default CreateSnapshotProposal;
