import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import dayjs from "@lib/dayjs";
import { MAXIMUM_VALUE_UINT256 } from "@lib/utils";
import { Box, Button, Flex, Text } from "@livepeer/design-system";
import {
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { formatPercent } from "@utils/numberFormatters";
import { parseAmountToWei } from "@utils/web3";
import {
  useBondingManagerAddress,
  useLivepeerTokenAddress,
} from "hooks/useContracts";
import { useHandleTransaction } from "hooks/useHandleTransaction";
import { useOrchestratorRewardCutSpike } from "hooks/useOrchestratorRewardCutSpike";
import { useMemo, useState } from "react";
import { useSimulateContract, useWriteContract } from "wagmi";

import ProgressSteps from "../ProgressSteps";

/**
 * Info banner above the Delegate button. Becomes a yellow warning when
 * `useOrchestratorRewardCutSpike` returns a qualifying spike.
 */
const CutChangeNotice = ({ orchestratorId }: { orchestratorId?: string }) => {
  const spike = useOrchestratorRewardCutSpike(orchestratorId);

  if (spike) {
    return (
      <Flex
        css={{
          alignItems: "center",
          gap: "$3",
          padding: "$3",
          marginBottom: "$3",
          borderRadius: "$3",
          background: "$yellow3",
          border: "1px solid $yellow7",
        }}
      >
        <Box
          as={ExclamationTriangleIcon}
          css={{ color: "$yellow11", flexShrink: 0, width: 16, height: 16 }}
        />
        <Text css={{ fontSize: "$2", color: "$yellow11", lineHeight: 1.5 }}>
          This orchestrator&apos;s reward cut increased sharply{" "}
          {dayjs(spike.endTimestamp).fromNow()} (
          {formatPercent(spike.fromRewardCut, { precision: 0 })} →{" "}
          {formatPercent(spike.toRewardCut, { precision: 0 })}). Review history
          before delegating.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      css={{
        alignItems: "center",
        gap: "$3",
        padding: "$3",
        marginBottom: "$3",
        borderRadius: "$3",
        background: "$neutral3",
      }}
    >
      <Box
        as={InfoCircledIcon}
        css={{ color: "white", flexShrink: 0, width: 16, height: 16 }}
      />
      <Text css={{ fontSize: "$2", color: "white", lineHeight: 1.5 }}>
        Please ensure you have checked the reward & fee cut history before
        delegating.
      </Text>
    </Flex>
  );
};

const Delegate = ({
  to,
  amount,
  isTransferStake,
  isMyTranscoder,
  tokenBalance,
  transferAllowance,
  reset,
  hint: {
    oldDelegateNewPosPrev,
    oldDelegateNewPosNext,
    currDelegateNewPosPrev,
    currDelegateNewPosNext,
  },
}) => {
  const { data: livepeerTokenAddress } = useLivepeerTokenAddress();

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    query: { enabled: Boolean(livepeerTokenAddress && bondingManagerAddress) },
    address: livepeerTokenAddress,
    abi: livepeerToken,
    functionName: "approve",
    args: [bondingManagerAddress ?? "0x", BigInt(MAXIMUM_VALUE_UINT256)],
  });
  const {
    data: approveData,
    isPending: approveIsLoading,
    writeContract: approveWrite,
    error: approveError,
    isSuccess: approveIsSuccess,
  } = useWriteContract();

  useHandleTransaction(
    "approve",
    approveData,
    approveError,
    approveIsLoading,
    approveIsSuccess,
    {
      type: "bond",
      amount: BigInt(MAXIMUM_VALUE_UINT256),
    }
  );

  // null when the amount is absent or not yet a valid number.
  const amountWei = useMemo(() => parseAmountToWei(amount), [amount]);
  const bondAmountWei = amountWei ?? 0n;
  // `tokenBalance` and `transferAllowance` are wei, so compare in wei.
  const sufficientBalance = useMemo(
    () => bondAmountWei > 0n && BigInt(tokenBalance ?? 0) >= bondAmountWei,
    [bondAmountWei, tokenBalance]
  );
  const sufficientTransferAllowance = useMemo(
    () => bondAmountWei > 0n && BigInt(transferAllowance ?? 0) >= bondAmountWei,
    [bondAmountWei, transferAllowance]
  );

  const bondWithHintArgs = {
    amount: bondAmountWei,
    to,
    oldDelegateNewPosPrev,
    oldDelegateNewPosNext,
    currDelegateNewPosPrev,
    currDelegateNewPosNext,
  };

  const { data: bondWithHintConfig } = useSimulateContract({
    // Simulating without the allowance in place reverts, and nothing re-runs a
    // cached failure once the approval lands. Gating on the allowance means the
    // simulation first runs when it can succeed. A zero amount moves no tokens,
    // so it needs no allowance.
    query: {
      enabled:
        Boolean(to) && (bondAmountWei === 0n || sufficientTransferAllowance),
    },
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "bondWithHint",
    args: [
      bondWithHintArgs.amount,
      to,
      oldDelegateNewPosPrev,
      oldDelegateNewPosNext,
      currDelegateNewPosPrev,
      currDelegateNewPosNext,
    ],
  });
  const {
    data: bondData,
    isPending: bondIsLoading,
    writeContract: bondWrite,
    isSuccess: bondIsSuccess,
    error: bondError,
  } = useWriteContract();

  useHandleTransaction(
    "bond",
    bondData,
    bondError,
    bondIsLoading,
    bondIsSuccess,
    bondWithHintArgs
  );

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);

  const amountIsNonEmpty = useMemo(() => amount, [amount]);

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  const showApproveFlow = useMemo(
    () =>
      (amountIsNonEmpty && +amount >= 0 && !sufficientTransferAllowance) ||
      (approvalSubmitted && sufficientTransferAllowance),
    [amount, amountIsNonEmpty, sufficientTransferAllowance, approvalSubmitted]
  );

  const onApprove = async () => {
    try {
      if (!config) {
        throw new Error("No config for approve");
      }
      setApprovalSubmitted(true);

      approveWrite(config.request);
    } catch (e) {
      console.log(e);
    }
  };

  const onDelegate = async () => {
    try {
      if (!bondWithHintConfig) {
        throw new Error("No config for bond with hint");
      }
      bondWrite(bondWithHintConfig.request);
    } catch (e) {
      console.error(e);
    }

    setApprovalSubmitted(false);
    reset();
  };

  if (amountWei === null && !isTransferStake) {
    return (
      <Button size="4" disabled variant="neutral" css={{ width: "100%" }}>
        Enter an Amount
      </Button>
    );
  }

  if (amountWei !== null && !sufficientBalance) {
    return (
      <Button size="4" disabled variant="neutral" css={{ width: "100%" }}>
        Insufficient Balance
      </Button>
    );
  }

  const cutChangeNotice = isMyTranscoder ? null : (
    <CutChangeNotice orchestratorId={to} />
  );

  if (showApproveFlow) {
    return (
      <>
        {cutChangeNotice}
        <Box>
          <Box
            css={{
              display: "grid",
              gap: "$3",
              gridTemplateColumns: "1fr 1fr",
            }}
          >
            <Button
              size="4"
              variant="primary"
              disabled={sufficientTransferAllowance}
              onClick={onApprove}
              css={{ width: "100%" }}
            >
              Approve
            </Button>
            <Button
              size="4"
              disabled={!sufficientTransferAllowance || !bondWithHintConfig}
              variant="primary"
              onClick={onDelegate}
              css={{ width: "100%" }}
            >
              {+amount >= 0 && isTransferStake ? "Switch" : "Delegate"}
            </Button>
          </Box>
          <ProgressSteps
            steps={[sufficientTransferAllowance]}
            css={{ mt: "$3" }}
          />
        </Box>
      </>
    );
  }

  return (
    <>
      {cutChangeNotice}
      <Button
        size="4"
        disabled={!bondWithHintConfig}
        onClick={onDelegate}
        variant="primary"
        css={{ width: "100%" }}
      >
        {+amount >= 0 && isTransferStake ? "Move Delegated Stake" : "Delegate"}
      </Button>
    </>
  );
};

export default Delegate;
