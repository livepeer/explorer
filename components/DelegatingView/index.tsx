import Utils from "web3-utils";
import {
  abbreviateNumber,
  checkAddressEquality,
  initTransaction,
} from "@lib/utils";
import { useWeb3React } from "@web3-react/core";
import { useRouter } from "next/router";
import Link from "next/link";
import StakeTransactions from "../StakeTransactions";
import Stat from "@components/Stat";
import {
  Link as A,
  Box,
  Flex,
  Button,
  Text,
  Tooltip,
} from "@livepeer/design-system";
import Masonry from "react-masonry-css";
import NumberFormat from "react-number-format";
import { scientificToDecimal } from "../../lib/utils";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import { useApolloClient } from "@apollo/client";
import { useContext } from "react";
import { MutationsContext } from "contexts";
import { ethers } from "ethers";

const Index = ({
  delegator,
  transcoders,
  protocol,
  currentRound,
  delegateProfile,
}) => {
  const router = useRouter();
  const query = router.query;
  const context = useWeb3React();
  const client = useApolloClient();
  const { withdrawFees }: any = useContext(MutationsContext);

  const isMyAccount = checkAddressEquality(
    context?.account,
    query.account.toString()
  );

  if (!delegator?.bondedAmount) {
    if (isMyAccount) {
      return (
        <Box css={{ pt: "$4" }}>
          <Box css={{ mr: "$3", mb: "$3" }}>
            Delegate LPT with an Orchestrator to begin earning LPT rewards and a
            share of the fees being paid into the Livepeer network.
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

  const pendingStake = parseFloat(Utils.fromWei(delegator.pendingStake));
  const unbonded = delegator.unbonded ? +delegator.unbonded : 0;

  const rewards =
    pendingStake + (unbonded ? unbonded : 0) - +delegator.principal;
  const totalActiveStake = +protocol.totalActiveStake;
  const lifetimeEarnings = +delegator.pendingFees + +delegator.withdrawnFees;
  const withdrawButtonDisabled = delegator.pendingFees === "0";

  const breakpointColumnsObj = {
    default: 2,
    1100: 2,
    700: 2,
    500: 1,
  };

  return (
    <Box
      css={{
        pt: "$4",
        ".masonry-grid": {
          display: "flex",
          marginLeft: "-$3",
          width: "auto",
        },
        ".masonry-grid_column": {
          paddingLeft: "$3",
          backgroundClip: "padding-box",
        },

        ".masonry-grid_column > .masonry-grid_item": {
          marginBottom: "$3",
        },
      }}
    >
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {delegator.delegate && (
          <Link
            href={`/accounts/${delegator.delegate.id}/orchestrating`}
            passHref
          >
            <A
              className="masonry-grid_item"
              css={{
                display: "block",
                textDecoration: "none",
                "&:hover": { textDecoration: "none" },
              }}
            >
              <Stat
                label="Delegated with"
                variant="interactive"
                value={
                  <Box>
                    {process.env.NEXT_PUBLIC_THREEBOX_ENABLED &&
                    delegateProfile?.name
                      ? delegateProfile.name
                      : delegator.delegate.id.replace(
                          delegator.delegate.id.slice(7, 37),
                          "…"
                        )}
                  </Box>
                }
              />{" "}
            </A>
          </Link>
        )}

        <Stat
          className="masonry-grid_item"
          label="Stake"
          value={
            <Box
              css={{
                mb: "$4",
                fontSize: 26,
              }}
            >
              {pendingStake}
              <Box as="span" css={{ ml: "$2" }}>
                LPT
              </Box>
            </Box>
          }
          meta={
            <Box>
              <Flex
                css={{
                  fontSize: "$2",
                  mb: "$1",
                  justifyContent: "space-between",
                }}
              >
                <Flex css={{ alignItems: "center" }}>
                  <Box>Lifetime Undelegated</Box>
                  <Tooltip
                    multiline
                    content={
                      <Box>
                        This is the amount undelegated over the lifetime of this
                        account.
                      </Box>
                    }
                  >
                    <Flex css={{ ml: "$1" }}>
                      <QuestionMarkCircledIcon />
                    </Flex>
                  </Tooltip>
                </Flex>
                <Box>
                  {unbonded > 0 ? (
                    <Text size="2" css={{ fontWeight: 600, color: "$red11" }}>
                      -{abbreviateNumber(unbonded, 3)} LPT
                    </Text>
                  ) : (
                    <Text size="2" css={{ fontWeight: 600 }}>
                      0 LPT
                    </Text>
                  )}
                </Box>
              </Flex>
              <Flex css={{ fontSize: "$2", justifyContent: "space-between" }}>
                <Flex css={{ alignItems: "center" }}>
                  <Box>Lifetime Rewards</Box>
                  <Tooltip
                    multiline
                    content={
                      <Box>
                        The account&apos;s total rewards earned all-time.
                      </Box>
                    }
                  >
                    <Flex css={{ ml: "$1" }}>
                      <QuestionMarkCircledIcon />
                    </Flex>
                  </Tooltip>
                </Flex>
                <Text size="2" css={{ fontWeight: 600, color: "$green11" }}>
                  +{Math.abs(parseFloat(abbreviateNumber(rewards, 6)))} LPT
                </Text>
              </Flex>
            </Box>
          }
        />
        <Stat
          className="masonry-grid_item"
          label="Pending Fees"
          value={
            <Box
              css={{
                mb: "$4",
                fontSize: 26,
              }}
            >
              <NumberFormat
                value={delegator.pendingFees}
                displayType="text"
                decimalScale={13}
              />{" "}
              ETH
            </Box>
          }
          meta={
            <Box>
              <Flex
                css={{
                  mb: "$1",
                  fontSize: "$2",
                  justifyContent: "space-between",
                }}
              >
                <Flex css={{ alignItems: "center" }}>
                  <Box>Lifetime earnings</Box>
                </Flex>
                <Text size="2" css={{ fontWeight: 600 }}>
                  {scientificToDecimal(lifetimeEarnings)} ETH
                </Text>
              </Flex>
              <Flex
                css={{
                  fontSize: "$2",
                  justifyContent: "space-between",
                }}
              >
                <Flex css={{ alignItems: "center" }}>
                  <Box>Withdrawn</Box>
                  <Tooltip
                    multiline
                    content={
                      <Box>
                        The total fees withdrawn over the lifetime of this
                        account.
                      </Box>
                    }
                  >
                    <Flex css={{ ml: "$1" }}>
                      <QuestionMarkCircledIcon />
                    </Flex>
                  </Tooltip>
                </Flex>
                <Text size="2" css={{ fontWeight: 600 }}>
                  <NumberFormat
                    value={
                      delegator.withdrawnFees ? delegator.withdrawnFees : "0"
                    }
                    displayType="text"
                    decimalScale={13}
                  />{" "}
                  ETH
                </Text>
              </Flex>
              {isMyAccount && !withdrawButtonDisabled && (
                <Button
                  variant="primary"
                  size="4"
                  css={{
                    mt: "$3",
                    width: "100%",
                  }}
                  onClick={() => {
                    initTransaction(client, async () => {
                      await withdrawFees({
                        variables: {
                          recipient: delegator.id,
                          amount: ethers.utils
                            .parseEther(delegator.pendingFees)
                            .toString(),
                        },
                        context: {
                          signer: context.library.getSigner(),
                        },
                      });
                    });
                  }}
                >
                  Withdraw Pending Fees
                </Button>
              )}
            </Box>
          }
        />
        {delegator.delegate && (
          <Stat
            className="masonry-grid_item"
            label={
              <Flex css={{ alignItems: "center" }}>
                <Box>Network Equity</Box>
                <Tooltip
                  multiline
                  content={
                    <Box>
                      The account&apos;s equity relative to the entire network.
                    </Box>
                  }
                >
                  <Flex css={{ ml: "$1" }}>
                    <QuestionMarkCircledIcon />
                  </Flex>
                </Tooltip>
              </Flex>
            }
            value={
              <Box>
                {totalActiveStake === 0
                  ? 0
                  : ((pendingStake / totalActiveStake) * 100).toPrecision(4)}
                %
              </Box>
            }
            meta={
              <Box css={{ mt: "$4" }}>
                <Flex
                  css={{
                    fontSize: "$2",
                    mb: "$1",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    Account (
                    {totalActiveStake === 0
                      ? 0
                      : ((pendingStake / totalActiveStake) * 100).toPrecision(
                          4
                        )}
                    %)
                  </Box>
                  <Text size="2" css={{ fontWeight: 600 }}>
                    {abbreviateNumber(pendingStake, 5)} LPT
                  </Text>
                </Flex>
                <Flex
                  css={{
                    fontSize: "$2",
                    mb: "$1",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    Orchestrator (
                    {totalActiveStake === 0
                      ? 0
                      : (
                          (+delegator.delegate.totalStake / totalActiveStake) *
                          100
                        ).toPrecision(4)}
                    %)
                  </Box>
                  <Text size="2" css={{ fontWeight: 600 }}>
                    {abbreviateNumber(+delegator.delegate.totalStake, 3)} LPT
                  </Text>
                </Flex>
              </Box>
            }
          />
        )}
      </Masonry>
      <StakeTransactions
        transcoders={transcoders}
        delegator={delegator}
        currentRound={currentRound}
        isMyAccount={isMyAccount}
      />
    </Box>
  );
};

export default Index;
