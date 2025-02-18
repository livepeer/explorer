import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@jjasonn.stone/design-system";
import { useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useSimulateContract, useWriteContract } from "wagmi";

const Index = ({ unbondingLockId, newPosPrev, newPosNext }: any) => {
  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: simulateData } = useSimulateContract({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "rebondWithHint",
    args: [unbondingLockId, newPosPrev, newPosNext],
  });

  const { writeContract, data, isPending, error, isSuccess } = useWriteContract();

  const handleWrite = () => {
    if (!simulateData) return;
    writeContract(simulateData.request);
  };

  useHandleTransaction("rebond", data ? { hash: data } : undefined, error, isPending, isSuccess, {
    unbondingLockId,
    newPosPrev,
    newPosNext,
  });

  return (
    <>
      <Button variant="primary" size="3" onClick={handleWrite} css={{ mr: "$3" }}>
        Redelegate
      </Button>
    </>
  );
};

export default Index;
