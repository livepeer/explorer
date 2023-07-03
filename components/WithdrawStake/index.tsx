import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useContractWrite, usePrepareContractWrite } from "wagmi";

const Index = ({ unbondingLockId }: any) => {
  const accountAddress = useAccountAddress();

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { config } = usePrepareContractWrite({
    enabled: Boolean(unbondingLockId && bondingManagerAddress),
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "withdrawStake",
    args: [unbondingLockId],
  });
  const { data, isLoading, write, error, isSuccess } = useContractWrite(config);

  useHandleTransaction("withdrawStake", data, error, isLoading, isSuccess, {
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
        onClick={write}
        css={{ py: "$2", mr: "$3" }}
      >
        Withdraw
      </Button>
    </>
  );
};

export default Index;
