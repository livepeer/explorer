import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useContractWrite, usePrepareContractWrite } from "wagmi";

const Index = ({ unbondingLockId, newPosPrev, newPosNext }: any) => {
  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { config } = usePrepareContractWrite({
    enabled: Boolean(unbondingLockId && bondingManagerAddress),
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "rebondWithHint",
    args: [unbondingLockId, newPosPrev, newPosNext],
  });
  const { data, isLoading, write, error, isSuccess } = useContractWrite(config);

  useHandleTransaction("rebond", data, error, isLoading, isSuccess, {
    unbondingLockId,
    newPosPrev,
    newPosNext,
  });

  return (
    <>
      <Button variant="primary" size="3" onClick={write} css={{ mr: "$3" }}>
        Redelegate
      </Button>
    </>
  );
};

export default Index;
