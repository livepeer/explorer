import { gql, useQuery } from "@apollo/client";
import { LAYOUT_MAX_WIDTH } from "@layouts/main";
import { Box, Button, Container, Text } from "@livepeer/design-system";
import { useAccountAddress } from "hooks";

import Link from "next/link";

const InactiveWarning = () => {
  const accountAddress = useAccountAddress();
  const query = gql`
    query delegator($id: ID!) {
      delegator(id: $id) {
        id
        delegate {
          id
          active
        }
      }
      protocol(id: "0") {
        id
        pendingActivation {
          id
        }
      }
    }
  `;

  const { data, loading } = useQuery(query, {
    variables: {
      id: accountAddress?.toLowerCase(),
    },
    pollInterval: 60000,
  });

  const isPendingActivation = data?.protocol?.pendingActivation.some((o) => {
    return o.id.toLowerCase() === data?.delegator?.delegate?.id.toLowerCase();
  });

  const isOrchestrator = data?.delegator?.delegate?.id === data?.delegator?.id;

  // If delegate is inactive and not pending activation show warning
  const showWarning =
    data?.delegator?.delegate?.active === false && !isPendingActivation;

  if (!showWarning || loading || isOrchestrator) {
    return null;
  }

  return (
    <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, mb: "$5" }}>
      <Box
        css={{
          mt: "$5",
          borderRadius: 10,
          width: "100%",
          padding: "$4",
          color: "$loContrast",
          bc: "$amber11",
        }}
      >
        <Box
          css={{
            mb: "$2",
            fontSize: "$6",
            fontWeight: 600,
          }}
        >
          Orchestrator Inactive
        </Box>
        <Box>
          <Text css={{ color: "$loContrast" }}>
            You are delegated to an inactive orchestrator, which means that you
            will not receive LPT rewards or ETH fees.
          </Text>
          <Link href="/orchestrators" passHref>
            <Button
              as="a"
              size="3"
              css={{ mt: "$2" }}
              variant="transparentBlack"
              ghost
            >
              View Active Orchestrators
            </Button>
          </Link>
        </Box>
      </Box>
    </Container>
  );
};

export default InactiveWarning;
