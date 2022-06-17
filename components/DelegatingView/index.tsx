import { useApolloClient } from "@apollo/client";
import { ExplorerTooltip } from "@components/ExplorerTooltip";
import Stat from "@components/Stat";
import { checkAddressEquality, initTransaction } from "@lib/utils";
import {
  Box,
  Button,
  Flex,
  Link as A,
  Text,
} from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import { MutationsContext } from "contexts";
import { ethers } from "ethers";
import { useAccountAddress } from "hooks";
import Link from "next/link";
import { useRouter } from "next/router";
import numeral from "numeral";
import { useContext, useMemo } from "react";
import Masonry from "react-masonry-css";
import StakeTransactions from "../StakeTransactions";

const breakpointColumnsObj = {
  default: 2,
  1100: 2,
  700: 2,
  500: 1,
};

const Index = ({ delegator, transcoders, protocol, currentRound }) => {
  const router = useRouter();
  const query = router.query;
  const accountAddress = useAccountAddress();
  const client = useApolloClient();
  const { withdrawFees }: any = useContext(MutationsContext);

  const isMyAccount = checkAddressEquality(
    accountAddress,
    query.account.toString()
  );

  const pendingStake = useMemo(
    () => Number(delegator?.pendingStake || 0) / 10 ** 18,
    [delegator?.pendingStake]
  );
  const unbonded = useMemo(
    () => Math.abs(delegator?.unbonded || 0),
    [delegator]
  );

  const rewards = useMemo(
    () => pendingStake + unbonded - Math.abs(delegator?.principal ?? 0),
    [unbonded, pendingStake, delegator]
  );
  const totalActiveStake = useMemo(
    () => Math.abs(protocol.totalActiveStake),
    [protocol]
  );
  const lifetimeEarnings = useMemo(
    () =>
      Math.abs(delegator?.pendingFees ?? 0) +
      Math.abs(delegator?.withdrawnFees ?? 0),
    [delegator]
  );
  const withdrawButtonDisabled = useMemo(
    () => Number(delegator?.pendingFees ?? 0) === 0,
    [delegator]
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
                    {delegator.delegate.identity?.name
                      ? delegator.delegate.identity?.name
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
              {`${numeral(pendingStake).format("0.0a")} LPT`}
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
                  <ExplorerTooltip
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
                  </ExplorerTooltip>
                </Flex>
                <Box>
                  {unbonded > 0 ? (
                    <Text size="2" css={{ fontWeight: 600, color: "$red11" }}>
                      {numeral(-unbonded).format("+0.0a")} LPT
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
                  <ExplorerTooltip
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
                  </ExplorerTooltip>
                </Flex>
                <Text size="2" css={{ fontWeight: 600, color: "$green11" }}>
                  {numeral(Math.abs(rewards)).format("+0.0a")} LPT
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
              {numeral(delegator.pendingFees).format("0.000")} ETH
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
                  <ExplorerTooltip
                    multiline
                    content={
                      <Box>
                        The total fees earned over the lifetime of this account
                        (since the migration to Arbitrum One).
                      </Box>
                    }
                  >
                    <Flex css={{ ml: "$1" }}>
                      <QuestionMarkCircledIcon />
                    </Flex>
                  </ExplorerTooltip>
                </Flex>
                <Text size="2" css={{ fontWeight: 600 }}>
                  {numeral(lifetimeEarnings || 0).format("0.000a")} ETH
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
                  <ExplorerTooltip
                    multiline
                    content={
                      <Box>
                        The total fees withdrawn over the lifetime of this
                        account (since the migration to Arbitrum One).
                      </Box>
                    }
                  >
                    <Flex css={{ ml: "$1" }}>
                      <QuestionMarkCircledIcon />
                    </Flex>
                  </ExplorerTooltip>
                </Flex>
                <Text size="2" css={{ fontWeight: 600 }}>
                  {numeral(delegator?.withdrawnFees || 0).format("0.000a")} ETH
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
                <ExplorerTooltip
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
                </ExplorerTooltip>
              </Flex>
            }
            value={
              <Box>
                {numeral(
                  totalActiveStake === 0
                    ? 0
                    : delegator.delegate.id === delegator.id
                    ? (Math.abs(delegator.delegate.totalStake) + pendingStake) /
                      totalActiveStake
                    : pendingStake / totalActiveStake
                ).format("0.000%")}
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
                    {numeral(
                      totalActiveStake === 0
                        ? 0
                        : pendingStake / totalActiveStake
                    ).format("0.00%")}
                    )
                  </Box>
                  <Text size="2" css={{ fontWeight: 600 }}>
                    {numeral(pendingStake).format("0.00a")} LPT
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
                    {numeral(
                      totalActiveStake === 0
                        ? 0
                        : Math.abs(delegator.delegate.totalStake) /
                            totalActiveStake
                    ).format("0.00%")}
                    )
                  </Box>
                  <Text size="2" css={{ fontWeight: 600 }}>
                    {numeral(Math.abs(delegator.delegate.totalStake)).format(
                      "0.00a"
                    )}{" "}
                    LPT
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
