import { EnsIdentity } from "@api/types/get-ens";
import {
  getDelegatorStatus,
  getHint,
  simulateNewActiveSetOrder
} from "@lib/utils";
import { Box, Button } from "@livepeer/design-system";
import { Delegator, Round, Transcoder } from "apollo";
import { parseUnits } from "ethers/lib/utils";
import { useAccountAddress } from "hooks";
import Delegate from "./Delegate";
import Footnote from "./Footnote";
import Undelegate from "./Undelegate";

type FooterData = {
  isTransferStake: boolean;
  isMyTranscoder: boolean;
  isDelegated: boolean;
  transcoders: [Transcoder];
  action: string;
  amount: string;
  transcoder: Transcoder;
  delegator?: Delegator;
  currentRound: Round;
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

  const tokenBalance =
    account && parseUnits(account.tokenBalance, "wei").toNumber();
  const transferAllowance =
    account && parseUnits(account.allowance, "wei").toNumber();
  const delegatorStatus = getDelegatorStatus(delegator, currentRound);
  const stake = delegator?.pendingStake
    ? parseUnits(delegator.pendingStake, "wei").toNumber()
    : 0;
  const sufficientStake = delegator && amount && parseFloat(amount) <= stake;
  const canUndelegate = isMyTranscoder && isDelegated && parseFloat(amount) > 0;
  const newActiveSetOrder = simulateNewActiveSetOrder({
    action,
    transcoders: JSON.parse(JSON.stringify(transcoders)),
    amount: parseUnits(amount ? amount.toString() : "0", "wei").toNumber(),
    newDelegate: transcoder.id,
    oldDelegate: delegator?.delegate?.id,
  });
  const { newPosPrev, newPosNext } = getHint(
    delegator?.delegate?.id,
    newActiveSetOrder
  );
  const {
    newPosPrev: currDelegateNewPosPrev,
    newPosNext: currDelegateNewPosNext,
  } = getHint(transcoder.id, newActiveSetOrder);

  if (action === "delegate") {
    if (!isDelegated) {
      delegator = {
        id: account?.id,
        lastClaimRound: { id: "0" },
      };
    }

    return (
      <Box css={{ ...css }}>
        <Delegate
          delegator={delegator}
          to={transcoder.id}
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
