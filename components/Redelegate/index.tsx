import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useWriteContract, useSimulateContract } from "wagmi";

const Index = ({ unbondingLockId, newPosPrev, newPosNext }: any) => {
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
      <Button
        variant="primary"
        size="3"
        onClick={() => config && writeContract(config.request)}
        css={{ marginRight: "$3" }}
      >
        Redelegate
      </Button>
    </>
  );
};

export default Index;
