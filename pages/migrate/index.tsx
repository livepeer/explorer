import { Container, Card, Heading, Text, Box } from "@jjasonn.stone/design-system";
import { getLayout } from "@layouts/main";
import { useEffect } from "react";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { isL2ChainId } from "@lib/chains";
import { useRouter } from "next/router";
import Link from "next/link";

const Migrate = () => {
  const router = useRouter();

  // Redirect if not on an L2
  useEffect(() => {
    if (!isL2ChainId(DEFAULT_CHAIN_ID)) {
      router.push("/");
    }
  }, [router]);

  return (
    <Container
      size="2"
      css={{
        maxWidth: 650,
        mt: "$8",
        width: "100%",
        "@bp3": {
          width: 650,
        },
      }}
    >
      <Heading
        size="2"
        as="h1"
        css={{ mb: "$6", textAlign: "center", fontWeight: "bold" }}
      >
        L2 Migration Tool
      </Heading>
      <CardLink
        href="/migrate/orchestrator"
        heading="Orchestrators"
        text={`Migrate your stake, delegated stake, and fees to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}.`}
      />
      <CardLink
        href="/migrate/broadcaster"
        heading="Broadcasters"
        text={`Migrate your deposit and reserve to ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}.`}
      />
      <CardLink
        href="/migrate/delegator"
        heading="Delegators*"
        text={
          <Box>
            *This migration tool is only for delegators that need to migrate{" "}
            <strong>undelegated stake</strong> to{" "}
            {CHAIN_INFO[DEFAULT_CHAIN_ID].label}. If you had stake on L1, it can
            be claimed directly on {CHAIN_INFO[DEFAULT_CHAIN_ID].label}.
          </Box>
        }
      />
    </Container>
  );
};

function CardLink({ href, heading, text }) {
  return (
    <Link href={href} passHref>
      <Card
        as="a"
        css={{
          p: "$5",
          borderRadius: "$4",
          backgroundColor: "$panel",
          border: "1px solid $neutral5",
          mb: "$4",
          textDecoration: "none",
          transition: ".15s background-color",
          "&:hover": {
            textDecoration: "none",
            bc: "$neutral3",
            transition: ".15s background-color",
          },
        }}
      >
        <Heading as="h3" css={{ mb: "$1" }}>
          {heading}
        </Heading>
        <Text variant="neutral">{text}</Text>
      </Card>
    </Link>
  );
}
Migrate.getLayout = getLayout;

export default Migrate;
