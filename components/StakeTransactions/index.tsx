import Utils from "web3-utils";
import {
  abbreviateNumber,
  getHint,
  simulateNewActiveSetOrder,
} from "../../lib/utils";
import { UnbondingLock } from "../../@types";
import Restake from "../Restake";
import RestakeFromUnstaked from "../RestakeFromUnstaked";
import WithdrawStake from "../WithdrawStake";
import { Card, Text, Box, Flex, Heading } from "@livepeer/design-system";

const Index = ({ delegator, transcoders, currentRound, isMyAccount }) => {
  const pendingStakeTransactions: Array<UnbondingLock> =
    delegator.unbondingLocks.filter(
      (item: UnbondingLock) =>
        item.withdrawRound && item.withdrawRound > parseInt(currentRound.id, 10)
    );
  const completedStakeTransactions: Array<UnbondingLock> =
    delegator.unbondingLocks.filter(
      (item: UnbondingLock) =>
        item.withdrawRound &&
        item.withdrawRound <= parseInt(currentRound.id, 10)
    );
  const isBonded = !!delegator.delegate;

  return (
    <Box css={{ mt: "$6" }}>
      {!!pendingStakeTransactions.length && (
        <Box css={{ mb: "$6" }}>
          <Heading size="1" css={{ mb: "$4" }}>
            Pending Transactions
          </Heading>
          {pendingStakeTransactions.map((lock) => {
            const newActiveSetOrder = simulateNewActiveSetOrder({
              action: "stake",
              transcoders: JSON.parse(JSON.stringify(transcoders)),
              amount: Utils.toWei(lock.amount),
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
                  p: "$4",
                  mb: "$2",
                }}
              >
                <Flex
                  css={{
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Box css={{ mb: "$1" }}>
                      Undelegating from{" "}
                      {lock.delegate.id.replace(
                        lock.delegate.id.slice(7, 37),
                        "…"
                      )}
                    </Box>
                    <Text variant="neutral" size="1">
                      Tokens will be available for withdrawal in approximately{" "}
                      {lock.withdrawRound - parseInt(currentRound.id, 10)} days.
                    </Text>
                  </Box>
                  <Flex css={{ alignItems: "center" }}>
                    {isMyAccount &&
                      (isBonded ? (
                        <Restake
                          unbondingLockId={lock.unbondingLockId}
                          newPosPrev={newPosPrev}
                          newPosNext={newPosNext}
                          delegator={delegator}
                        />
                      ) : (
                        <RestakeFromUnstaked
                          unbondingLockId={lock.unbondingLockId}
                          delegate={lock.delegate.id}
                          newPosPrev={newPosPrev}
                          newPosNext={newPosNext}
                          delegator={delegator}
                        />
                      ))}
                    <Box css={{ ml: "$4" }}>
                      {" "}
                      <Box as="span" css={{ fontFamily: "$monospace" }}>
                        {abbreviateNumber(lock.amount, 4)}
                      </Box>{" "}
                      LPT
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
              action: "stake",
              transcoders: JSON.parse(JSON.stringify(transcoders)),
              amount: Utils.toWei(lock.amount),
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
                  p: "$4",
                  mb: "$2",
                }}
              >
                <Flex
                  css={{
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    Undelegated from{" "}
                    {lock.delegate.id.replace(
                      lock.delegate.id.slice(7, 37),
                      "…"
                    )}
                  </Box>

                  <Flex css={{ alignItems: "center" }}>
                    {isMyAccount && (
                      <>
                        {isBonded ? (
                          <Restake
                            unbondingLockId={lock.unbondingLockId}
                            newPosPrev={newPosPrev}
                            newPosNext={newPosNext}
                            delegator={delegator}
                          />
                        ) : (
                          <RestakeFromUnstaked
                            unbondingLockId={lock.unbondingLockId}
                            delegate={lock.delegate.id}
                            newPosPrev={newPosPrev}
                            newPosNext={newPosNext}
                            delegator={delegator}
                          />
                        )}
                        <WithdrawStake unbondingLockId={lock.unbondingLockId} />
                      </>
                    )}
                    <Box css={{ ml: "$4" }}>
                      {" "}
                      <Box as="span" css={{ fontFamily: "$monospace" }}>
                        {abbreviateNumber(lock.amount, 3)}
                      </Box>{" "}
                      LPT
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
