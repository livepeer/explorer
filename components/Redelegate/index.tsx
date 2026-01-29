import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useHandleTransaction } from "hooks/useHandleTransaction";
import { useDelegationReview } from "hooks/useDelegationReview";
import DelegationReview from "@components/DelegationReview";
import { useSimulateContract, useWriteContract } from "wagmi";

const Index = ({ unbondingLockId, newPosPrev, newPosNext, delegator, currentRound }) => {
  const { warnings } = useDelegationReview({
    action: "transfer",
    delegator,
    currentRound,
  });
  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "rebondWithHint",
    args: [unbondingLockId, newPosPrev, newPosNext],
  });
  const { data, isPending, writeContract, error, isSuccess } =
    useWriteContract();

  useHandleTransaction("rebond", data, error, isPending, isSuccess, {
    unbondingLockId,
    newPosPrev,
    newPosNext,
  });

  return (
    <>
      <DelegationReview warnings={warnings} />
      <Button
        css={{
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
        Redelegate
      </Button>
    </>
  );
};

export default Index;
