import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useContractWrite, usePrepareContractWrite } from "wagmi";

const Index = ({ unbondingLockId, delegate, newPosPrev, newPosNext }: any) => {
  const accountAddress = useAccountAddress();

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { config } = usePrepareContractWrite({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "rebondFromUnbondedWithHint",
    args: [delegate, unbondingLockId, newPosPrev, newPosNext],
  });
  const { data, isLoading, write, error, isSuccess } = useContractWrite(config);

  useHandleTransaction(
    "rebondFromUnbonded",
    data,
    error,
    isLoading,
    isSuccess,
    {
      delegate,
      unbondingLockId,
      newPosPrev,
      newPosNext,
    },
  );

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button variant="primary" size="3" onClick={write} css={{ mr: "$3" }}>
        Redelegate
      </Button>
    </>
  );
};

export default Index;
