import { LAYOUT_MAX_WIDTH } from "@layouts/main";
import { Box, Button, Container, Text } from "@livepeer/design-system";
import { useAccountInactiveQuery } from "apollo";
import { useAccountAddress } from "hooks";

import Link from "next/link";

const InactiveWarning = () => {
  const accountAddress = useAccountAddress();

  const { data, loading } = useAccountInactiveQuery({
    variables: {
      id: accountAddress?.toLowerCase() ?? "",
    },
    pollInterval: 120000,
    skip: !accountAddress,
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
    <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, marginBottom: "$5" }}>
      <Box
        css={{
          marginTop: "$5",
          borderRadius: 10,
          width: "100%",
          padding: "$4",
          color: "$loContrast",
          backgroundColor: "$amber11",
        }}
      >
        <Box
          css={{
            marginBottom: "$2",
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
            <Button
              size="3"
              css={{ marginTop: "$2" }}
              variant="transparentBlack"
              ghost
              as={Link}
              href="/orchestrators"
            >
              View Active Orchestrators
            </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default InactiveWarning;
