import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import { MAXIMUM_VALUE_UINT256 } from "@lib/utils";
import { Box, Button } from "@livepeer/design-system";
import { parseEther } from "ethers/lib/utils";
import { useHandleTransaction } from "hooks";
import {
  useBondingManagerAddress,
  useLivepeerTokenAddress,
} from "hooks/useContracts";
import { useMemo, useState } from "react";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import ProgressSteps from "../ProgressSteps";

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

  const { config } = usePrepareContractWrite({
    enabled: Boolean(livepeerTokenAddress && bondingManagerAddress),
    address: livepeerTokenAddress,
    abi: livepeerToken,
    functionName: "approve",
    args: [bondingManagerAddress, BigInt(MAXIMUM_VALUE_UINT256)],
  });
  const {
    data: approveData,
    isLoading: approveIsLoading,
    write: approveWrite,
    error: approveError,
    isSuccess: approveIsSuccess,
  } = useContractWrite(config);

  useHandleTransaction(
    "approve",
    approveData,
    approveError,
    approveIsLoading,
    approveIsSuccess,
    {
      type: "bond",
      amount: MAXIMUM_VALUE_UINT256,
    }
  );

  const bondWithHintArgs = {
    amount: amount?.toString() ? parseEther(amount) : "0",
    to,
    oldDelegateNewPosPrev,
    oldDelegateNewPosNext,
    currDelegateNewPosPrev,
    currDelegateNewPosNext,
  };

  const { config: bondWithHintConfig } = usePrepareContractWrite({
    enabled: Boolean(to),
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
    isLoading: bondIsLoading,
    write: bondWrite,
    isSuccess: bondIsSuccess,
    error: bondError,
  } = useContractWrite(bondWithHintConfig);

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

      approveWrite();
    } catch (e) {
      console.log(e);
    }
  };

  const onDelegate = async () => {
    try {
      bondWrite();
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
