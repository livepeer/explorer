import { EnsIdentity } from "@lib/api/types/get-ens";
import {
  getDelegatorStatus,
  getHint,
  simulateNewActiveSetOrder,
} from "@lib/utils";
import { Box, Button } from "@livepeer/design-system";
import { AccountQueryResult, OrchestratorsSortedQueryResult } from "apollo";
import { parseEther } from "ethers/lib/utils";
import {
  StakingAction,
  useAccountAddress,
  useAccountBalanceData,
  usePendingFeesAndStakeData,
} from "hooks";
import { useMemo } from "react";
import Delegate from "./Delegate";
import Footnote from "./Footnote";
import Undelegate from "./Undelegate";
import { TranscoderOrDelegateType } from "@components/DelegatingWidget";

type FooterData = {
  isTransferStake: boolean;
  isMyTranscoder: boolean;
  isDelegated: boolean;

  action: StakingAction;
  amount: string;

  currentRound: NonNullable<
    NonNullable<AccountQueryResult["data"]>["protocol"]
  >["currentRound"] | undefined;

  transcoders: NonNullable<
    OrchestratorsSortedQueryResult["data"]
  >["transcoders"] | undefined;
  transcoder: TranscoderOrDelegateType;
  delegator?: NonNullable<AccountQueryResult["data"]>["delegator"];
  account: EnsIdentity;
};
interface Props {
  reset: Function;
  data: FooterData;
  css?: object;
}

const Footer = ({
  reset,
  data: {
    isTransferStake,
    isDelegated,
    isMyTranscoder,
    transcoders,
    delegator,
    transcoder,
    action,
    amount,
    account,
    currentRound,
  },
  css = {},
}: Props) => {
  const accountAddress = useAccountAddress();

  const delegatorPendingStakeAndFees = usePendingFeesAndStakeData(
    delegator?.id
  );
  const accountBalance = useAccountBalanceData(accountAddress);

  const tokenBalance = useMemo(() => accountBalance?.balance, [accountBalance]);
  const transferAllowance = useMemo(
    () => accountBalance?.allowance,
    [accountBalance]
  );
  const delegatorStatus = useMemo(
    () => getDelegatorStatus(delegator, currentRound),
    [currentRound, delegator]
  );
  const stake = useMemo(
    () =>
      delegatorPendingStakeAndFees?.pendingStake
        ? +delegatorPendingStakeAndFees?.pendingStake
        : 0,
    [delegatorPendingStakeAndFees]
  );
  const sufficientStake = useMemo(
    () => delegator && amount && parseFloat(amount) <= stake,
    [delegator, amount, stake]
  );
  const canUndelegate = useMemo(
    () => isMyTranscoder && isDelegated && parseFloat(amount) > 0,
    [isMyTranscoder, isDelegated, amount]
  );
  const newActiveSetOrder = useMemo(
    () =>
      simulateNewActiveSetOrder({
        action,
        transcoders: JSON.parse(JSON.stringify(transcoders)),
        amount: parseEther(amount ? amount.toString() : "0"),
        newDelegate: transcoder?.id ?? "",
        oldDelegate: delegator?.delegate?.id,
      }),
    [action, transcoders, amount, transcoder, delegator]
  );
  const { newPosPrev, newPosNext } = useMemo(
    () => getHint(delegator?.delegate?.id, newActiveSetOrder),
    [delegator, newActiveSetOrder]
  );
  const {
    newPosPrev: currDelegateNewPosPrev,
    newPosNext: currDelegateNewPosNext,
  } = useMemo(
    () => getHint(transcoder?.id, newActiveSetOrder),
    [newActiveSetOrder, transcoder]
  );

  if (!accountAddress) {
    return (
      <>
        <Button
          size="4"
          disabled={true}
          variant="primary"
          css={{ width: "100%" }}
        >
          {action === "delegate" ? "Delegate" : "Undelegate"}
        </Button>
        <Footnote>
          Connect your wallet to{" "}
          {action === "delegate" ? "delegate" : "undelegate"}.
        </Footnote>
      </>
    );
  }

  if (action === "delegate") {
    return (
      <Box css={{ ...css }}>
        <Delegate
          to={transcoder?.id}
          amount={amount}
          isTransferStake={isTransferStake}
          tokenBalance={tokenBalance}
          transferAllowance={transferAllowance}
          reset={reset}
          hint={{
            oldDelegateNewPosPrev: newPosPrev,
            oldDelegateNewPosNext: newPosNext,
            currDelegateNewPosPrev: currDelegateNewPosPrev,
            currDelegateNewPosNext: currDelegateNewPosNext,
          }}
        />
      </Box>
    );
  }
  return (
    <Box css={{ ...css }}>
      <Undelegate
        amount={amount}
        newPosPrev={newPosPrev}
        newPosNext={newPosNext}
        disabled={!canUndelegate || delegatorStatus === "Pending"}
      />
      {renderUnstakeWarnings(
        amount,
        delegatorStatus,
        isDelegated,
        sufficientStake,
        isMyTranscoder
      )}
    </Box>
  );
};

export default Footer;

function renderUnstakeWarnings(
  amount,
  delegatorStatus,
  isDelegated,
  sufficientStake,
  isMyTranscoder
) {
  if (delegatorStatus === "Pending") {
    return (
      <Footnote>
        Your account is in a pending state. You can undelegate during the next
        round.
      </Footnote>
    );
  }
  if (!isDelegated) {
    return <Footnote>One must delegate before one can undelegate.</Footnote>;
  }
  if (!isMyTranscoder) {
    return <Footnote>You&apos;re not delegated to this orchestrator.</Footnote>;
  }
  if (parseFloat(amount) && !sufficientStake) {
    return <Footnote>Insufficient stake</Footnote>;
  }
  return (
    <Footnote>
      {`Looking to move your delegated stake? No need to undelegate. Navigate to the orchestrator you wish to switch to and use the \"Move Delegated Stake\" feature.`}
    </Footnote>
  );
}
