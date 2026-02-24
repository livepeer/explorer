import { ExplorerTooltip } from "@components/ExplorerTooltip";
import Stat from "@components/Stat";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Box, Button, Flex, Link as A, Text } from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import { formatETH, formatLPT, formatPercent } from "@utils/numberFormatters";
import { checkAddressEquality, formatAddress } from "@utils/web3";
import { AccountQueryResult, OrchestratorsSortedQueryResult } from "apollo";
import {
  useAccountAddress,
  useEnsData,
  usePendingFeesAndStakeData,
} from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useHandleTransaction } from "hooks/useHandleTransaction";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import Masonry from "react-masonry-css";
import { Address } from "viem";
import { useSimulateContract, useWriteContract } from "wagmi";

import StakeTransactions from "../StakeTransactions";

const breakpointColumnsObj = {
  default: 2,
  1100: 2,
  700: 2,
  500: 1,
};

interface Props {
  transcoders?: NonNullable<
    OrchestratorsSortedQueryResult["data"]
  >["transcoders"];
  delegator?: NonNullable<AccountQueryResult["data"]>["delegator"];
  protocol?: NonNullable<AccountQueryResult["data"]>["protocol"];
  currentRound?: NonNullable<
    NonNullable<AccountQueryResult["data"]>["protocol"]
  >["currentRound"];
}

const Index = ({ delegator, transcoders, protocol, currentRound }: Props) => {
  const router = useRouter();
  const query = router.query;
  const accountAddress = useAccountAddress();

  const delegateIdentity = useEnsData(delegator?.delegate?.id);

  const pendingFeesAndStake = usePendingFeesAndStakeData(delegator?.id);

  const recipient = delegator?.id as Address | undefined;
  const amount = pendingFeesAndStake?.pendingFees ?? "0";

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    query: { enabled: Boolean(bondingManagerAddress && recipient) },
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "withdrawFees",
    args: [recipient ?? "0x", BigInt(amount)],
  });
  const { data, isPending, writeContract, isSuccess, error } =
    useWriteContract();

  useHandleTransaction("withdrawFees", data, error, isPending, isSuccess, {
    recipient,
    amount: BigInt(amount),
  });

  const isMyAccount = checkAddressEquality(
    accountAddress ?? "",
    query?.account?.toString() ?? ""
  );

  const pendingStake = useMemo(
    () => Number(pendingFeesAndStake?.pendingStake || 0) / 10 ** 18,
    [pendingFeesAndStake?.pendingStake]
  );
  const pendingFees = useMemo(
    () => Number(pendingFeesAndStake?.pendingFees || 0) / 10 ** 18,
    [pendingFeesAndStake?.pendingFees]
  );
  const unbonded = useMemo(
    () => Math.abs(+(delegator?.unbonded ?? 0) || 0),
    [delegator]
  );

  const rewards = useMemo(
    () => pendingStake + unbonded - Math.abs(+(delegator?.principal ?? 0)),
    [unbonded, pendingStake, delegator]
  );
  const totalActiveStake = useMemo(
    () => Math.abs(+(protocol?.totalActiveStake ?? 0)),
    [protocol]
  );
  const lifetimeEarnings = useMemo(
    () => Math.abs(pendingFees) + Math.abs(+(delegator?.withdrawnFees ?? 0)),
    [delegator, pendingFees]
  );
  const withdrawButtonDisabled = useMemo(
    () => pendingFees === 0,
    [pendingFees]
  );

  const networkEquity = (() => {
    if (!totalActiveStake) {
      return 0;
    }

    // If self-delegating, include total delegated stake + pending stake
    if (delegator?.delegate?.id === delegator?.id) {
      const delegateTotalStake = Math.abs(
        +(delegator?.delegate?.totalStake ?? 0)
      );
      return (delegateTotalStake + pendingStake) / totalActiveStake;
    }

    return pendingStake / totalActiveStake;
  })();

  if (!delegator?.bondedAmount) {
    if (isMyAccount) {
      return (
        <Box css={{ paddingTop: "$4" }}>
          <Box css={{ marginRight: "$3", marginBottom: "$3" }}>
            Delegate LPT with an Orchestrator to begin earning LPT rewards and a
            share of the fees being paid into the Livepeer network.
          </Box>
          <A as={Link} href="/orchestrators" passHref>
            <Button size="3" variant="primary">
              View Orchestrators
            </Button>
          </A>
        </Box>
      );
    } else {
      return <Box css={{ paddingTop: "$4" }}>Nothing here.</Box>;
    }
  }

  return (
    <Box
      css={{
        paddingTop: "$4",
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
        {delegator?.delegate && (
          <A
            as={Link}
            href={`/accounts/${delegator.delegate.id}/orchestrating`}
            passHref
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
                  {delegateIdentity?.name
                    ? delegateIdentity?.name
                    : formatAddress(delegator?.delegate?.id)}
                </Box>
              }
            />{" "}
          </A>
        )}

        <Stat
          className="masonry-grid_item"
          label="Stake"
          value={
            pendingFeesAndStake?.pendingStake ? (
              <Box
                css={{
                  marginBottom: "$2",
                  fontSize: 26,
                }}
              >
                {`${formatLPT(pendingStake, {
                  precision: pendingStake > 0 && pendingStake < 0.01 ? 4 : 2,
                })}`}
              </Box>
            ) : null
          }
          meta={
            <Box>
              <Flex
                css={{
                  fontSize: "$2",
                  marginBottom: "$1",
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
                    <Flex css={{ marginLeft: "$1" }}>
                      <Box
                        as={QuestionMarkCircledIcon}
                        css={{ color: "$neutral11" }}
                      />
                    </Flex>
                  </ExplorerTooltip>
                </Flex>
                <Box>
                  {unbonded > 0 ? (
                    <Text size="2" css={{ fontWeight: 600, color: "$red11" }}>
                      {formatLPT(-unbonded, { forceSign: true, precision: 2 })}
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
                    <Flex css={{ marginLeft: "$1" }}>
                      <Box
                        as={QuestionMarkCircledIcon}
                        css={{ color: "$neutral11" }}
                      />
                    </Flex>
                  </ExplorerTooltip>
                </Flex>
                <Text size="2" css={{ fontWeight: 600, color: "$green11" }}>
                  {formatLPT(Math.abs(rewards), {
                    forceSign: true,
                    precision: 2,
                  })}
                </Text>
              </Flex>
            </Box>
          }
        />
        <Stat
          className="masonry-grid_item"
          label="Pending Fees"
          value={
            pendingFeesAndStake ? (
              <Box
                css={{
                  marginBottom: "$2",
                  fontSize: 26,
                }}
              >
                {formatETH(pendingFees, { precision: 3 })}
              </Box>
            ) : null
          }
          meta={
            <Box>
              <Flex
                css={{
                  marginBottom: "$1",
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
                    <Flex css={{ marginLeft: "$1" }}>
                      <Box
                        as={QuestionMarkCircledIcon}
                        css={{ color: "$neutral11" }}
                      />
                    </Flex>
                  </ExplorerTooltip>
                </Flex>
                <Text size="2" css={{ fontWeight: 600 }}>
                  {formatETH(lifetimeEarnings || 0, {
                    abbreviate: true,
                    precision: 3,
                  })}
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
                    <Flex css={{ marginLeft: "$1" }}>
                      <Box
                        as={QuestionMarkCircledIcon}
                        css={{ color: "$neutral11" }}
                      />
                    </Flex>
                  </ExplorerTooltip>
                </Flex>
                <Text size="2" css={{ fontWeight: 600 }}>
                  {formatETH(delegator?.withdrawnFees, {
                    abbreviate: true,
                    precision: 3,
                  })}
                </Text>
              </Flex>
              {isMyAccount && !withdrawButtonDisabled && delegator?.id && (
                <Button
                  css={{
                    marginTop: "$3",
                    width: "100%",
                  }}
                  disabled={!config}
                  onClick={() => config && writeContract(config.request)}
                  size="4"
                  variant="primary"
                >
                  Withdraw Pending Fees
                </Button>
              )}
            </Box>
          }
        />
        {delegator?.delegate && (
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
                  <Flex css={{ marginLeft: "$1" }}>
                    <Box
                      as={QuestionMarkCircledIcon}
                      css={{ color: "$neutral11" }}
                    />
                  </Flex>
                </ExplorerTooltip>
              </Flex>
            }
            value={<Box>{formatPercent(networkEquity, { precision: 3 })}</Box>}
            meta={
              <Box css={{ marginTop: "$4" }}>
                <Flex
                  css={{
                    fontSize: "$2",
                    marginBottom: "$1",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    Account (
                    {formatPercent(
                      totalActiveStake === 0
                        ? 0
                        : pendingStake / totalActiveStake,
                      { precision: 2 }
                    )}
                    )
                  </Box>
                  <Text size="2" css={{ fontWeight: 600 }}>
                    {formatLPT(pendingStake, { precision: 2 })}
                  </Text>
                </Flex>
                <Flex
                  css={{
                    fontSize: "$2",
                    marginBottom: "$1",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    Orchestrator (
                    {formatPercent(
                      totalActiveStake === 0
                        ? 0
                        : Math.abs(+delegator.delegate.totalStake) /
                            totalActiveStake,
                      { precision: 2 }
                    )}
                    )
                  </Box>
                  <Text size="2" css={{ fontWeight: 600 }}>
                    {formatLPT(Math.abs(+delegator.delegate.totalStake), {
                      precision: 2,
                      abbreviate: true,
                    })}
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
