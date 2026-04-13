import { Box, Card, Flex, Heading, Text } from "@livepeer/design-system";
import { formatLPT } from "@utils/numberFormatters";
import { formatAddress } from "@utils/web3";
import { UnbondingLock } from "apollo";
import { useMemo } from "react";
import { parseEther } from "viem";

import { getHint, simulateNewActiveSetOrder } from "../../lib/utils";
import Redelegate from "../Redelegate";
import RedelegateFromUndelegated from "../RedelegateFromUndelegated";
import WithdrawStake from "../WithdrawStake";

const Index = ({ delegator, transcoders, currentRound, isMyAccount }) => {
  const isBonded = !!delegator.delegate;

  const pendingStakeTransactions = useMemo(() => {
    const roundId = parseInt(currentRound.id, 10);
    return delegator.unbondingLocks.filter(
      (item: UnbondingLock) =>
        item.withdrawRound && +item.withdrawRound > roundId
    );
  }, [delegator.unbondingLocks, currentRound.id]);
  const completedStakeTransactions = useMemo(() => {
    const roundId = parseInt(currentRound.id, 10);
    return delegator.unbondingLocks.filter(
      (item: UnbondingLock) =>
        item.withdrawRound && +item.withdrawRound <= roundId
    );
  }, [delegator.unbondingLocks, currentRound.id]);

  return (
    <Box css={{ marginTop: "$6" }}>
      {!!pendingStakeTransactions.length && (
        <Box css={{ marginBottom: "$6" }}>
          <Heading size="1" css={{ marginBottom: "$4" }}>
            Pending Transactions
          </Heading>
          {pendingStakeTransactions.map((lock) => {
            const newActiveSetOrder = simulateNewActiveSetOrder({
              action: "delegate",
              transcoders: JSON.parse(JSON.stringify(transcoders)),
              amount: parseEther(lock.amount),
              newDelegate: isBonded ? delegator.delegate.id : lock.delegate.id,
            });
            const { newPosPrev, newPosNext } = getHint(
              isBonded ? delegator.delegate.id : lock.delegate.id,
              newActiveSetOrder
            );
            return (
              <Card
                key={lock.id}
                css={{
                  border: "1px solid $neutral4",
                  padding: "$4",
                  marginBottom: "$2",
                }}
              >
                <Flex
                  css={{
                    alignItems: "flex-start",
                    flexDirection: "column",
                    gap: "$3",
                    width: "100%",
                    justifyContent: "space-between",
                    "@bp2": {
                      alignItems: "center",
                      flexDirection: "row",
                      gap: 0,
                    },
                  }}
                >
                  <Box>
                    <Box css={{ marginBottom: "$1" }}>
                      Undelegating from {formatAddress(lock.delegate.id)}
                    </Box>
                    <Text variant="neutral" size="1">
                      Tokens will be available for withdrawal in approximately{" "}
                      {+lock.withdrawRound - parseInt(currentRound.id, 10)}{" "}
                      days.
                    </Text>
                  </Box>
                  <Flex
                    css={{
                      alignItems: "center",
                      flexDirection: "column",
                      gap: "$2",
                      width: "100%",
                      "@bp2": {
                        flexDirection: "row",
                        width: "auto",
                        justifyContent: "flex-end",
                        gap: 0,
                      },
                    }}
                  >
                    {isMyAccount && (
                      <Flex
                        css={{
                          justifyContent: "flex-start",
                          width: "100%",
                          "@bp2": {
                            width: "auto",
                          },
                        }}
                      >
                        {isBonded ? (
                          <Redelegate
                            unbondingLockId={lock.unbondingLockId}
                            newPosPrev={newPosPrev}
                            newPosNext={newPosNext}
                          />
                        ) : (
                          <RedelegateFromUndelegated
                            unbondingLockId={lock.unbondingLockId}
                            delegate={lock.delegate.id}
                            newPosPrev={newPosPrev}
                            newPosNext={newPosNext}
                          />
                        )}
                      </Flex>
                    )}
                    <Box
                      css={{
                        alignSelf: "flex-end",
                        fontWeight: 700,
                        marginTop: "$1",
                        "@bp2": {
                          alignSelf: "auto",
                          fontWeight: 400,
                          marginLeft: "$4",
                          marginTop: 0,
                        },
                      }}
                    >
                      <Box as="span" css={{ fontFamily: "$monospace" }}>
                        {formatLPT(lock.amount)}
                      </Box>
                    </Box>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Box>
      )}
      {!!completedStakeTransactions.length && (
        <Box>
          <Heading size="1" css={{ mb: "$4" }}>
            Available for Withdrawal
          </Heading>
          {completedStakeTransactions.map((lock) => {
            const newActiveSetOrder = simulateNewActiveSetOrder({
              action: "delegate",
              transcoders: JSON.parse(JSON.stringify(transcoders)),
              amount: parseEther(lock.amount),
              newDelegate: isBonded ? delegator.delegate.id : lock.delegate.id,
            });
            const { newPosPrev, newPosNext } = getHint(
              isBonded ? delegator.delegate.id : lock.delegate.id,
              newActiveSetOrder
            );
            return (
              <Card
                key={lock.id}
                css={{
                  border: "1px solid $neutral4",
                  padding: "$4",
                  marginBottom: "$2",
                }}
              >
                <Flex
                  css={{
                    alignItems: "flex-start",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "$3",
                    width: "100%",
                    "@bp2": {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 0,
                    },
                  }}
                >
                  <Box>Undelegated from {formatAddress(lock.delegate.id)}</Box>

                  <Flex
                    css={{
                      alignItems: "center",
                      flexDirection: "column",
                      gap: "$2",
                      width: "100%",
                      "@bp2": {
                        flexDirection: "row",
                        gap: 0,
                        justifyContent: "flex-end",
                        width: "auto",
                      },
                    }}
                  >
                    {isMyAccount && (
                      <Flex
                        css={{
                          justifyContent: "flex-start",
                          flexDirection: "column",
                          gap: "$2",
                          width: "100%",
                          "@bp2": {
                            flexDirection: "row",
                            gap: 0,
                            width: "auto",
                          },
                        }}
                      >
                        {isBonded ? (
                          <Redelegate
                            unbondingLockId={lock.unbondingLockId}
                            newPosPrev={newPosPrev}
                            newPosNext={newPosNext}
                          />
                        ) : (
                          <RedelegateFromUndelegated
                            unbondingLockId={lock.unbondingLockId}
                            delegate={lock.delegate.id}
                            newPosPrev={newPosPrev}
                            newPosNext={newPosNext}
                          />
                        )}
                        <WithdrawStake unbondingLockId={lock.unbondingLockId} />
                      </Flex>
                    )}
                    <Box
                      css={{
                        alignSelf: "flex-end",
                        fontWeight: 700,
                        marginTop: "$1",
                        "@bp2": {
                          alignSelf: "auto",
                          fontWeight: 400,
                          marginLeft: "$4",
                          marginTop: 0,
                        },
                      }}
                    >
                      <Box as="span" css={{ fontFamily: "$monospace" }}>
                        {formatLPT(lock.amount)}
                      </Box>
                    </Box>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Index;
