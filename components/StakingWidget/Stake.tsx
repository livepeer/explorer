import React, { useContext, useState } from "react";
import { useApolloClient } from "@apollo/client";
import Utils from "web3-utils";
import { MutationsContext } from "core/contexts";
import { initTransaction, MAXIUMUM_VALUE_UINT256 } from "../../lib/utils";
import ProgressSteps from "../ProgressSteps";
import { Box, Button } from "@livepeer/design-system";

const Stake = ({
  to,
  amount,
  switching,
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

  const amountEntered = amount !== "";
  const sufficientBalance =
    amountEntered && +amount >= 0 && +amount <= tokenBalance;
  const sufficientTransferAllowance =
    amountEntered && transferAllowance > 0 && +amount <= transferAllowance;

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  const showApproveFlow =
    (amountEntered && +amount >= 0 && !sufficientTransferAllowance) ||
    (approvalSubmitted && sufficientTransferAllowance);

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

  const onStake = () => {
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

  if (!amountEntered) {
    return (
      <Button size="4" disabled variant="neutral" css={{ width: "100%" }}>
        Enter an Amount
      </Button>
    );
  }

  if (amountEntered && +amount >= 0 && !sufficientBalance) {
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
            onClick={onStake}
            css={{ width: "100%" }}
          >
            {+amount >= 0 && switching ? "Move Delegated Stake" : "Delegate"}
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
      onClick={onStake}
      variant="primary"
      css={{ width: "100%" }}
    >
      {+amount >= 0 && switching ? "Move Delegated Stake" : "Delegate"}
    </Button>
  );
};

export default Stake;
