import React from "react";
import Input from "./Input";
import Utils from "web3-utils";
import { Box, Flex, Card } from "@livepeer/design-system";
import { ExplorerTooltip } from "@components/ExplorerTooltip";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { AccountQueryResult } from "apollo";
import {
  StakingAction,
  useAccountBalanceData,
  usePendingFeesAndStakeData,
} from "hooks";

interface Props {
  transcoder: AccountQueryResult["data"]["transcoder"];
  delegator?: AccountQueryResult["data"]["delegator"];
  protocol: AccountQueryResult["data"]["protocol"];
  account: EnsIdentity;
  action?: StakingAction;
  delegateProfile?: EnsIdentity;

  amount: string;
  setAmount: (a: string) => void;
}

const InputBox = ({
  account,
  action,
  delegator,
  transcoder,
  amount,
  setAmount,
  protocol,
}: Props) => {
  const delegatorPendingStakeAndFees = usePendingFeesAndStakeData(
    delegator?.id
  );
  const accountBalance = useAccountBalanceData(account?.id);

  const tokenBalance =
    accountBalance && Utils.fromWei(accountBalance.balance.toString());
  const stake = delegatorPendingStakeAndFees?.pendingStake
    ? Utils.fromWei(delegatorPendingStakeAndFees.pendingStake)
    : "0";

  return (
    <Card
      css={{
        bc: "$neutral3",
        boxShadow: "$colors$neutral5 0px 0px 0px 1px inset",
        width: "100%",
        borderRadius: "$4",
      }}
    >
      <Box css={{ px: "$3", py: "$3" }}>
        <Box>
          <Flex
            css={{ fontSize: "$1", mb: "$3", justifyContent: "space-between" }}
          >
            <Box css={{ color: "$muted" }}>Input</Box>

            {account &&
              (action === "delegate" ? (
                <ExplorerTooltip content="Enter Max">
                  <Box
                    onClick={() => setAmount(tokenBalance)}
                    css={{ cursor: "pointer", color: "$muted" }}
                  >
                    Balance:{" "}
                    <Box as="span" css={{ fontFamily: "$monospace" }}>
                      {parseFloat(tokenBalance)}
                    </Box>
                  </Box>
                </ExplorerTooltip>
              ) : (
                <>
                  {+stake > 0 && (
                    <ExplorerTooltip content="Enter Max Amount">
                      <Box
                        onClick={() => setAmount(stake)}
                        css={{ cursor: "pointer", color: "$muted" }}
                      >
                        Stake:{" "}
                        <Box as="span" css={{ fontFamily: "$monospace" }}>
                          {+stake}
                        </Box>
                      </Box>
                    </ExplorerTooltip>
                  )}
                </>
              ))}
          </Flex>
          <Flex
            as="form"
            css={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Input
              transcoder={transcoder}
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAmount(e.target.value ? e.target.value : "");
              }}
              protocol={protocol}
            />
          </Flex>
        </Box>
      </Box>
    </Card>
  );
};

export default InputBox;
