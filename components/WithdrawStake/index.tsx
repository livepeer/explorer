import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useAccountAddress } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useHandleTransaction } from "hooks/useHandleTransaction";
import { useSimulateContract, useWriteContract } from "wagmi";
import { useDelegationReview } from "hooks/useDelegationReview";
import DelegationReview from "@components/DelegationReview";

const Index = ({ unbondingLockId, delegator, currentRound }) => {
  const accountAddress = useAccountAddress();

  const { warnings } = useDelegationReview({
    action: "undelegate",
    delegator,
    currentRound,
  });
  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "withdrawStake",
    args: [unbondingLockId],
  });
  const { data, isPending, writeContract, error, isSuccess } =
    useWriteContract();

  useHandleTransaction("withdrawStake", data, error, isPending, isSuccess, {
    unbondingLockId,
  });

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <DelegationReview warnings={warnings} />
      <Button
        css={{
          paddingTop: "$2",
          paddingBottom: "$2",
          marginRight: "$3",
          width: "100%",
          "@bp2": {
            width: "auto",
          },
        }}
        disabled={!config}
        onClick={() => config && writeContract(config.request)}
        size="3"
        variant="primary"
      >
        Withdraw
      </Button>
    </>
  );
};

export default Index;
