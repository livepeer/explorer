import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useSimulateContract, useWriteContract } from "wagmi";

const Index = ({ unbondingLockId, newPosPrev, newPosNext }) => {
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
        css={{ marginRight: "$3" }}
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
