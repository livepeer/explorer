import { MAXIMUM_VALUE_UINT256 } from "@lib/utils";
import { Box, Button } from "@livepeer/design-system";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { useHandleTransaction, useLivepeerContracts } from "hooks";
import { useMemo, useState } from "react";
import ProgressSteps from "../ProgressSteps";

const Delegate = ({
  to,
  amount,
  isTransferStake,
  tokenBalance,
  transferAllowance,
  delegator,
  reset,
  hint: {
    oldDelegateNewPosPrev,
    oldDelegateNewPosNext,
    currDelegateNewPosPrev,
    currDelegateNewPosNext,
  },
}) => {
  const { bondingManager, livepeerToken } = useLivepeerContracts();
  const handleBondTransaction = useHandleTransaction("bond");
  const handleApproveTransaction = useHandleTransaction("approve");

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);

  const amountIsNonEmpty = useMemo(() => amount !== "", [amount]);
  const sufficientBalance = useMemo(
    () =>
      amountIsNonEmpty &&
      BigNumber.from(amount).gt(0) &&
      BigNumber.from(tokenBalance).gte(amount),
    [amount, amountIsNonEmpty, tokenBalance]
  );
  const sufficientTransferAllowance = useMemo(
    () =>
      amountIsNonEmpty &&
      BigNumber.from(transferAllowance).gt(0) &&
      BigNumber.from(transferAllowance).gte(amount),
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

      await handleApproveTransaction(
        () =>
          livepeerToken.approve(bondingManager.address, MAXIMUM_VALUE_UINT256),
        {
          type: "bond",
          amount: MAXIMUM_VALUE_UINT256,
        }
      );
    } catch (e) {
      console.log(e);
    }
  };

  const onDelegate = async () => {
    try {
      const args = {
        amount: parseEther(amount ? amount.toString() : "0"),
        to,
        oldDelegateNewPosPrev,
        oldDelegateNewPosNext,
        currDelegateNewPosPrev,
        currDelegateNewPosNext,
      };

      await handleBondTransaction(
        () =>
          bondingManager.bondWithHint(
            args.amount,
            to,
            oldDelegateNewPosPrev,
            oldDelegateNewPosNext,
            currDelegateNewPosPrev,
            currDelegateNewPosNext
          ),
        args
      );
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
