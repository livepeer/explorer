import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@jjasonn.stone/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useSimulateContract, useWriteContract } from "wagmi";

const Index = ({ unbondingLockId, delegate, newPosPrev, newPosNext }: any) => {
  const accountAddress = useAccountAddress();

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: simulateData } = useSimulateContract({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "rebondFromUnbondedWithHint",
    args: [delegate, unbondingLockId, newPosPrev, newPosNext],
  });

  const { writeContract, data, isPending, error, isSuccess } = useWriteContract();

  const handleWrite = () => {
    if (!simulateData) return;
    writeContract(simulateData.request);
  };

  useHandleTransaction(
    "rebondFromUnbonded",
    data ? { hash: data } : undefined,
    error,
    isPending,
    isSuccess,
    {
      delegate,
      unbondingLockId,
      newPosPrev,
      newPosNext,
    }
  );

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button variant="primary" size="3" onClick={handleWrite} css={{ mr: "$3" }}>
        Redelegate
      </Button>
    </>
  );
};

export default Index;
