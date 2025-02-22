import React, { useMemo } from "react";
import Input from "./Input";
import { Box, Flex, Card } from "@livepeer/design-system";
import { ExplorerTooltip } from "@components/ExplorerTooltip";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { AccountQueryResult } from "apollo";
import {
  StakingAction,
  useAccountAddress,
  useAccountBalanceData,
  usePendingFeesAndStakeData,
} from "hooks";
import { fromWei } from "@lib/utils";
import { TranscoderOrDelegateType } from "@components/DelegatingWidget";
import { ConsoleView } from "react-device-detect";

interface Treasury {
  treasuryRewardCutRate: number;
}

interface Props {
  transcoder: TranscoderOrDelegateType;
  delegator?: NonNullable<AccountQueryResult["data"]>["delegator"];
  protocol: NonNullable<AccountQueryResult["data"]>["protocol"];
  treasury: Treasury;
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
  treasury,
}: Props) => {
  const walletAddress = useAccountAddress();
  const delegatorPendingStakeAndFees = usePendingFeesAndStakeData(
    delegator?.id
  );
  const accountBalance = useAccountBalanceData(account?.id);

  const tokenBalance = useMemo(
    () => accountBalance && fromWei(accountBalance.balance.toString()),
    [accountBalance]
  );
  const stake = useMemo(
    () =>
      delegatorPendingStakeAndFees?.pendingStake
        ? fromWei(delegatorPendingStakeAndFees.pendingStake)
        : "0",
    [delegatorPendingStakeAndFees]
  );

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

            {walletAddress &&
              (action === "delegate" ? (
                <ExplorerTooltip content="Enter Max Amount">
                  <Box
                    onClick={() => setAmount(tokenBalance ?? "0")}
                    css={{ cursor: "pointer", color: "$muted" }}
                  >
                    Balance:{" "}
                    <Box as="span" css={{ fontFamily: "$monospace" }}>
                      {parseFloat(tokenBalance ?? "0")}
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
              treasury={treasury}
            />
          </Flex>
        </Box>
      </Box>
    </Card>
  );
};

export default InputBox;
