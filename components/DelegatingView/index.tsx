import { ExplorerTooltip } from "@components/ExplorerTooltip";
import Stat from "@components/Stat";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { checkAddressEquality } from "@lib/utils";
import { Box, Button, Flex, Link as A, Text } from "@jjasonn.stone/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import { AccountQueryResult, OrchestratorsSortedQueryResult } from "apollo";
import {
  useAccountAddress,
  useEnsData,
  useHandleTransaction,
  usePendingFeesAndStakeData,
} from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import Link from "next/link";
import { useRouter } from "next/router";
import numeral from "numeral";
import { useMemo } from "react";
import Masonry from "react-masonry-css";
import { Address, useContractWrite, usePrepareContractWrite } from "wagmi";
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

  const { config } = usePrepareContractWrite({
    enabled: Boolean(bondingManagerAddress && recipient),
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "withdrawFees",
    args: [recipient ?? "0x", BigInt(amount)],
  });
  const { data, isLoading, write, isSuccess, error } = useContractWrite(config);

  useHandleTransaction("withdrawFees", data, error, isLoading, isSuccess, {
    recipient,
    amount,
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

  if (!delegator?.bondedAmount) {
    if (isMyAccount) {
      return (
        <Box css={{ pt: "$4" }}>
          <Box css={{ mr: "$3", mb: "$3" }}>
            Delegate LPT with an Orchestrator to begin earning LPT rewards and a
            share of the fees being paid into the Livepeer network.
          </Box>
          <Link href="/orchestrators" passHref legacyBehavior>
            <Button size="3" variant="primary" >
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
        {delegator?.delegate && (
          <A
            href={`/accounts/${delegator.delegate.id}/orchestrating`}
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
                    {delegateIdentity?.name
                      ? delegateIdentity?.name
                      : delegator?.delegate?.id.replace(
                          delegator?.delegate?.id.slice(7, 37),
                          "…"
                        )}
                  </Box>
                }
              />
            </A>
          </A>
        )}

        <Stat
          className="masonry-grid_item"
          label="Stake"
          value={
            pendingFeesAndStake?.pendingStake ? (
              <Box
                css={{
                  mb: "$2",
                  fontSize: 26,
                }}
              >
                {`${numeral(pendingStake).format("0.00a")} LPT`}
              </Box>
            ) : null
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
                      {numeral(-unbonded).format("+0.00a")} LPT
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
                      <Box
                        as={QuestionMarkCircledIcon}
                        css={{ color: "$neutral11" }}
                      />
                    </Flex>
                  </ExplorerTooltip>
                </Flex>
                <Text size="2" css={{ fontWeight: 600, color: "$green11" }}>
                  {numeral(Math.abs(rewards)).format("+0.00a")} LPT
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
                  mb: "$2",
                  fontSize: 26,
                }}
              >
                {numeral(pendingFees).format("0.000")} ETH
              </Box>
            ) : null
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
                      <Box
                        as={QuestionMarkCircledIcon}
                        css={{ color: "$neutral11" }}
                      />
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
                      <Box
                        as={QuestionMarkCircledIcon}
                        css={{ color: "$neutral11" }}
                      />
                    </Flex>
                  </ExplorerTooltip>
                </Flex>
                <Text size="2" css={{ fontWeight: 600 }}>
                  {numeral(delegator?.withdrawnFees || 0).format("0.000a")} ETH
                </Text>
              </Flex>
              {isMyAccount && !withdrawButtonDisabled && delegator?.id && (
                <Button
                  size="4"
                  css={{
                    bc: "$green4",
                    br: "$4",
                    color: "$green11",
                    fontSize: "$4",
                    mt: "$3",
                    width: "100%",
                    fontWeight: 600,
                    "&:hover": {
                      bc: "$green5",
                      color: "$green11",
                    },
                  }}
                  onClick={write}
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
                  <Flex css={{ ml: "$1" }}>
                    <Box
                      as={QuestionMarkCircledIcon}
                      css={{ color: "$neutral11" }}
                    />
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
                    ? (Math.abs(+delegator.delegate.totalStake) +
                        pendingStake) /
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
                        : Math.abs(+delegator.delegate.totalStake) /
                            totalActiveStake
                    ).format("0.00%")}
                    )
                  </Box>
                  <Text size="2" css={{ fontWeight: 600 }}>
                    {numeral(Math.abs(+delegator.delegate.totalStake)).format(
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
