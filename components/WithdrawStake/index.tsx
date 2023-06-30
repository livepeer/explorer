import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useContractWrite, usePrepareContractWrite } from "wagmi";

const Index = ({ unbondingLockId }) => {
  const accountAddress = useAccountAddress();

  const bondingManagerAddress = useBondingManagerAddress();

  const { config } = usePrepareContractWrite({
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
