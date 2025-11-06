import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useWriteContract, useSimulateContract } from "wagmi";

const Index = ({ unbondingLockId, delegate, newPosPrev, newPosNext }: any) => {
  const accountAddress = useAccountAddress();

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "rebondFromUnbondedWithHint",
    args: [delegate, unbondingLockId, newPosPrev, newPosNext],
  });
  const { data, isPending, writeContract, error, isSuccess } =
    useWriteContract();

  useHandleTransaction(
    "rebondFromUnbonded",
    data,
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
