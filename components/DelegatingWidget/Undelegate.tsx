import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@components/Button";

import { parseEther } from "ethers/lib/utils";
import { useAccountAddress, useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useContractWrite, usePrepareContractWrite } from "wagmi";

const Undelegate = ({ amount, newPosPrev, newPosNext, disabled }: any) => {
  const accountAddress = useAccountAddress();

  const args = {
    amount: parseEther(amount ? amount.toString() : "0"),
    newPosPrev,
    newPosNext,
  };

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { config } = usePrepareContractWrite({
    enabled: Boolean(bondingManagerAddress),
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "unbondWithHint",
    args: [BigInt(args.amount.toString()), newPosPrev, newPosNext],
  });
  const { data, isLoading, write, error, isSuccess } = useContractWrite(config);

  useHandleTransaction("unbond", data, error, isLoading, isSuccess, args);

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button
        size="4"
        disabled={disabled}
        color="danger"
        css={{ bc: "$red4",
            "&:disabled": { 
            cursor: "not-allowed"
          } }}
        onClick={write}
      >
        {!amount ? "Enter an amount" : "Undelegate"}
      </Button>
    </>
  );
};

export default Undelegate;
