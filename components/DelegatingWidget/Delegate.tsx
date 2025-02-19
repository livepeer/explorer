import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import { MAXIMUM_VALUE_UINT256 } from "@lib/utils";
import { Box } from "@jjasonn.stone/design-system";
import { parseEther } from "ethers/lib/utils";
import { useHandleTransaction } from "hooks";
import { Button } from "@components/Button";
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
    enabled: Boolean(livepeerTokenAddress && bondingManagerAddress && bondingManagerAddress !== "0x"),
    address: livepeerTokenAddress,
    abi: livepeerToken,
    functionName: "approve",
    args: [bondingManagerAddress!, BigInt(MAXIMUM_VALUE_UINT256)],
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
      BigInt(bondWithHintArgs.amount?.toString()),
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

      approveWrite?.();
    } catch (e) {
      console.log(e);
    }
  };

  const onDelegate = async () => {
    try {
      bondWrite?.();
    } catch (e) {
      console.error(e);
    }

    setApprovalSubmitted(false);
    reset();
  };

  if (!amountIsNonEmpty && !isTransferStake) {
    return (
      <Button size="4" disabled color="gray" css={{ width: "100%",
        "&:disabled": {
          cursor: "not-allowed" }
        }}>
        Enter an Amount
      </Button>
    );
  }

  if (amountIsNonEmpty && +amount >= 0 && !sufficientBalance) {
    return (
      <Button size="4" disabled color="gray" css={{ width: "100%",
        "&:disabled": {
          cursor: "not-allowed" }
      }}>
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
            color="green"
            disabled={sufficientTransferAllowance}
            onClick={onApprove}
            css={{ width: "100%" , "&:disabled": {
              cursor: "not-allowed" }
            }}
          >
            Approve
          </Button>
          <Button
            size="4"
            disabled={!sufficientTransferAllowance}
            color="green"
            onClick={onDelegate}
            css={{ width: "100%", "&:disabled": {
              cursor: "not-allowed" }
            }}
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
      color="green"
      css={{ width: "100%" }}
    >
      {+amount >= 0 && isTransferStake ? "Move Delegated Stake" : "Delegate"}
    </Button>
  );
};

export default Delegate;
