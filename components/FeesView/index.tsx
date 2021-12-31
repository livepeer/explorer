import Card from "../Card";
import NumberFormat from "react-number-format";
import { scientificToDecimal } from "../../lib/utils";
import ReactTooltip from "react-tooltip";
import Link from "next/link";
import WithdrawFees from "../WithdrawFees";
import HelpIcon from "../HelpIcon";
import { Box, Flex, Button, Link as A } from "@livepeer/design-system";

const Index = ({ delegator, isMyAccount }) => {
  if (!delegator?.bondedAmount) {
    if (isMyAccount) {
      return (
        <Box css={{ pt: "$4" }}>
          <Box css={{ mr: "$3", mb: "$3" }}>
            You haven&apos;t staked LPT. Stake with an Orchestrator to begin
            earning rewards and a share of the fees being paid into the Livepeer
            network.
          </Box>
          <Link href="/orchestrators" passHref>
            <Button asChild size="3" variant="primary">
              <A variant="primary">View Orchestrators</A>
            </Button>
          </Link>
        </Box>
      );
    } else {
      return <Box css={{ pt: "$4" }}>Nothing here.</Box>;
    }
  }

  const lifetimeEarnings = +delegator.pendingFees + +delegator.withdrawnFees;
  const withdrawButtonDisabled = delegator.pendingFees === "0";

  return (
    <Box css={{ pt: "$4" }}>
      <>
        <Box
          css={{
            display: "grid",
            gridGap: "$3",
            gridTemplateColumns: "repeat(auto-fit, minmax(100%, 1fr))",
            "@bp2": {
              gridTemplateColumns: "repeat(auto-fit, minmax(40%, 1fr))",
            },
          }}
        >
          <Card
            title="Lifetime Earnings"
            subtitle={
              <Box
                css={{
                  fontSize: "$4",
                  color: "$text",
                  fontWeight: 500,
                  fontFamily: "$monospace",
                  "@bp3": {
                    fontSize: "$5",
                  },
                }}
              >
                {scientificToDecimal(lifetimeEarnings)}
                <Box as="span" css={{ ml: "$2", fontSize: "$2" }}>
                  ETH
                </Box>
              </Box>
            }
          >
            <Box css={{ mt: "$4" }}>
              <Flex
                css={{
                  mb: "$2",
                  fontSize: "$2",
                  justifyContent: "space-between",
                }}
              >
                <Flex css={{ alignItems: "center" }}>
                  <Box css={{ color: "$muted" }}>Pending</Box>
                  <Flex>
                    <ReactTooltip
                      id="tooltip-pending-withdrawal"
                      className="tooltip"
                      place="top"
                      type="dark"
                      effect="solid"
                    />
                    <HelpIcon
                      data-tip="Total fees pending withdrawal"
                      data-for="tooltip-pending-withdrawal"
                    />
                  </Flex>
                </Flex>
                <Box as="span" css={{ fontFamily: "$monospace" }}>
                  <NumberFormat
                    value={delegator.pendingFees}
                    displayType="text"
                    decimalScale={13}
                  />{" "}
                  ETH
                </Box>
              </Flex>
              <Flex
                css={{
                  fontSize: "$2",
                  justifyContent: "space-between",
                }}
              >
                <Flex css={{ alignItems: "center" }}>
                  <Box css={{ color: "$muted" }}>Withdrawn</Box>
                  <Flex>
                    <ReactTooltip
                      id="tooltip-withdrawn"
                      className="tooltip"
                      place="top"
                      type="dark"
                      effect="solid"
                    />
                    <HelpIcon
                      data-tip="Total fees withdrawn over the lifetime of this account."
                      data-for="tooltip-withdrawn"
                    />
                  </Flex>
                </Flex>
                <Box as="span" css={{ fontFamily: "$monospace" }}>
                  <NumberFormat
                    value={
                      delegator.withdrawnFees ? delegator.withdrawnFees : "0"
                    }
                    displayType="text"
                    decimalScale={13}
                  />{" "}
                  ETH
                </Box>
              </Flex>
            </Box>
          </Card>
          {isMyAccount && (
            <Card
              title="Pending Withdrawal"
              subtitle={
                <Box
                  css={{
                    fontSize: "$4",
                    mb: "$3",
                    color: "$text",
                    fontWeight: 500,
                    fontFamily: "$monospace",
                    "@bp2": {
                      fontSize: "$5",
                    },
                  }}
                >
                  <NumberFormat
                    value={delegator.pendingFees}
                    displayType="text"
                    decimalScale={13}
                  />
                  <Box as="span" css={{ ml: "$2", fontSize: "$2" }}>
                    ETH
                  </Box>
                </Box>
              }
            >
              <WithdrawFees
                delegator={delegator}
                disabled={withdrawButtonDisabled}
                css={{
                  mt: "$2",
                  "@bp2": {
                    mt: "auto",
                  },
                }}
              >
                Withdraw
              </WithdrawFees>
            </Card>
          )}
        </Box>
      </>
    </Box>
  );
};

export default Index;
