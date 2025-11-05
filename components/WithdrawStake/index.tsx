import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useWriteContract, useSimulateContract } from "wagmi";

const Index = ({ unbondingLockId }: any) => {
  const accountAddress = useAccountAddress();

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
      <Button
        variant="primary"
        size="3"
        onClick={() => writeContract(config!.request)}
        css={{ paddingTop: "$2", paddingBottom: "$2", marginRight: "$3" }}
      >
        Withdraw
      </Button>
    </>
  );
};

export default Index;
