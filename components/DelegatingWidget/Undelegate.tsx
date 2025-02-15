import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@jjasonn.stone/design-system";

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
        ghost
        disabled={disabled}
        css={{
          bc: "$red5",
          color: "$red11",
          width: "100%",
          br: "$4",
          fontSize: "$4",

          "&:hover": {
            bc: "$red6",
            color: "$red11",
          },
        }}
        onClick={write}
      >
        {!amount ? "Enter an amount" : "Undelegate"}
      </Button>
    </>
  );
};

export default Undelegate;
