import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import { MAXIMUM_VALUE_UINT256, toWei } from "@lib/utils";
import { Box, Button } from "@jjasonn.stone/design-system";
import { parseEther } from "viem";
import { useHandleTransaction } from "hooks";
import {
  useBondingManagerAddress,
  useLivepeerTokenAddress,
} from "hooks/useContracts";
import { useMemo, useState, useEffect } from "react";
import { useSimulateContract, useWriteContract } from "wagmi";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import ProgressSteps from "../ProgressSteps";
import { Address } from "viem";
import { error } from "console";

const Delegate = ({
  to,
  amount,
  isTransferStake,
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
  const addRecentTransaction = useAddRecentTransaction();

  const { data: approveSimData } = useSimulateContract({
    address: livepeerTokenAddress,
    abi: livepeerToken,
    functionName: "approve",
    args: [bondingManagerAddress as Address, BigInt(MAXIMUM_VALUE_UINT256)],
    query: {
      enabled: Boolean(livepeerTokenAddress && bondingManagerAddress && bondingManagerAddress !== "0x")
    }

  });

  const { writeContract: approve, isPending: approveIsLoading, isSuccess: approveIsSuccess, data: approveWriteData } = useWriteContract();

  useEffect(() => {
    if (approveWriteData) {
      addRecentTransaction({
        hash: approveWriteData,
        description: "Approve"
      });
    }
  }, [approveWriteData, addRecentTransaction]);

  const handleApprove = () => {
    if (approveSimData?.request) {
      approve(approveSimData.request);
    }
  };

  useHandleTransaction(
    "approve",
    approveWriteData ? { hash: approveWriteData } : undefined,
    null,
    approveIsLoading,
    approveIsSuccess,
    {
      type: "bond",
      amount: MAXIMUM_VALUE_UINT256,
    }
  );

  const bondWithHintArgs = useMemo(() => ({
    amount: amount?.toString() ? parseEther(amount) : "0",
    to,
    oldDelegateNewPosPrev,
    oldDelegateNewPosNext,
    currDelegateNewPosPrev,
    currDelegateNewPosNext,
  }), [amount, to, oldDelegateNewPosPrev, oldDelegateNewPosNext, currDelegateNewPosPrev, currDelegateNewPosNext]);

  const { data: bondSimData } = useSimulateContract({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "bondWithHint",
    args: [
      BigInt(bondWithHintArgs.amount?.toString()),
      to,
      oldDelegateNewPosPrev,
      oldDelegateNewPosNext,
      currDelegateNewPosPrev,
      currDelegateNewPosNext,
    ],

  });

  const { writeContract: bond, isPending: bondIsLoading, isSuccess: bondIsSuccess, data: bondWriteData } = useWriteContract();

  useEffect(() => {
    if (bondWriteData) {
      addRecentTransaction({
        hash: bondWriteData,
        description: "Bond"
      });
    }
  }, [bondWriteData, addRecentTransaction]);

  const handleBond = () => {
    if (bondSimData?.request) {
      bond(bondSimData.request);
    }
  };

  useHandleTransaction(
    "bond",
    bondWriteData ? { hash: bondWriteData } : undefined,
    null,
    bondIsLoading,
    bondIsSuccess,
    bondWithHintArgs
  );

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);

  const amountIsNonEmpty = useMemo(() => amount, [amount]);
  const sufficientBalance = useMemo(
    () =>
      amountIsNonEmpty &&
      parseFloat(amount) > 0 &&
      Number(tokenBalance) >= amount,
    [amount, amountIsNonEmpty, tokenBalance]
  );
  const sufficientTransferAllowance = useMemo(
    () =>
      amountIsNonEmpty &&
      Number(transferAllowance) > 0 &&
      Number(transferAllowance) >= amount,
    [amount, amountIsNonEmpty, transferAllowance]
  );

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  const showApproveFlow = useMemo(
    () =>
      (amountIsNonEmpty && +amount >= 0 && !sufficientTransferAllowance) ||
      (approvalSubmitted && sufficientTransferAllowance),
    [amount, amountIsNonEmpty, sufficientTransferAllowance, approvalSubmitted]
  );

  const onApprove = async () => {
    try {
      setApprovalSubmitted(true);

      handleApprove();
    } catch (e) {
      console.log(e);
    }
  };

  const onDelegate = async () => {
    try {
      handleBond();
    } catch (e) {
      console.error(e);
    }

    setApprovalSubmitted(false);
    reset();
  };

  if (!amountIsNonEmpty && !isTransferStake) {
    return (
      <Button size="4" disabled variant="neutral" css={{ width: "100%" }}>
        Enter an Amount
      </Button>
    );
  }

  if (amountIsNonEmpty && +amount >= 0 && !sufficientBalance) {
    return (
      <Button size="4" disabled variant="neutral" css={{ width: "100%" }}>
        Insufficient Balance
      </Button>
    );
  }

  if (showApproveFlow) {
    return (
      <Box>
        <Box
          css={{ display: "grid", gap: "$3", gridTemplateColumns: "1fr 1fr" }}
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
            disabled={!sufficientTransferAllowance}
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
    );
  }

  return (
    <Button
      size="4"
      onClick={onDelegate}
      variant="primary"
      css={{ width: "100%" }}
    >
      {+amount >= 0 && isTransferStake ? "Move Delegated Stake" : "Delegate"}
    </Button>
  );
};

export default Delegate;
