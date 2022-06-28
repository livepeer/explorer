import React, { useContext, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/client";
import Utils from "web3-utils";
import { MutationsContext } from "../../contexts";
import { initTransaction, MAXIUMUM_VALUE_UINT256 } from "@lib/utils";
import ProgressSteps from "../ProgressSteps";
import { Box, Button } from "@livepeer/design-system";

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
  const client = useApolloClient();
  const { bond, approve }: any = useContext(MutationsContext);
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);

  const amountIsNonEmpty = amount !== "";
  const sufficientBalance = useMemo(
    () => amountIsNonEmpty && +amount >= 0 && +amount <= tokenBalance,
    [amount, amountIsNonEmpty, tokenBalance]
  );
  const sufficientTransferAllowance = useMemo(
    () =>
      amountIsNonEmpty && transferAllowance > 0 && +amount <= transferAllowance,
    [amount, amountIsNonEmpty, transferAllowance]
  );

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  const showApproveFlow = useMemo(
    () =>
      (amountIsNonEmpty && +amount >= 0 && !sufficientTransferAllowance) ||
      (approvalSubmitted && sufficientTransferAllowance),
    [amount, amountIsNonEmpty, sufficientTransferAllowance, approvalSubmitted]
  );

  const onApprove = () => {
    const tx = async () => {
      try {
        setApprovalSubmitted(true);
        await approve({
          variables: {
            type: "bond",
            amount: MAXIUMUM_VALUE_UINT256,
          },
        });
      } catch (e) {
        console.log(e);
      }
    };
    initTransaction(client, tx);
  };

  const onDelegate = () => {
    const tx = async () => {
      try {
        await bond({
          variables: {
            amount: Utils.toWei(amount ? amount.toString() : "0"),
            to,
            oldDelegateNewPosPrev,
            oldDelegateNewPosNext,
            currDelegateNewPosPrev,
            currDelegateNewPosNext,
            delegator: delegator?.id,
            lastClaimRound: parseInt(delegator?.lastClaimRound.id, 10),
          },
        });
      } catch (e) {
        console.error(e);
      }
    };

    initTransaction(client, tx);
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
