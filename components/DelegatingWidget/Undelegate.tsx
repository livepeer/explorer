import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@jjasonn.stone/design-system";

import { parseEther } from "ethers";
import { useAccountAddress, useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { useWriteContract, useSimulateContract } from "wagmi";

const Undelegate = ({ amount, newPosPrev, newPosNext, disabled }: any) => {
  const accountAddress = useAccountAddress();
  const args = {
    amount: parseEther(amount ? amount.toString() : "0"),
    newPosPrev,
    newPosNext,
  };

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: simulateData } = useSimulateContract({
    address: bondingManagerAddress ,
    abi: bondingManager,
    functionName: "unbondWithHint",
    args: [BigInt(args.amount.toString()), newPosPrev, newPosNext],
    query: {
      enabled: Boolean(bondingManagerAddress)
    }
  });

  const { writeContract, data: writeData, isPending, error } = useWriteContract();

  useHandleTransaction(
    "unbond",
    writeData ? { hash: writeData } : undefined,
    error,
    isPending,
    Boolean(writeData),
    { amount, newPosPrev, newPosNext }
  );

  const handleUnbond = async () => {
    if (simulateData?.request) {
      try {
        await writeContract(simulateData.request);
      } catch (err) {
        console.error("Unbond failed:", err);
      }
    }
  };

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button
        size="4"
        variant="red"
        disabled={disabled}
        onClick={handleUnbond}
        css={{
          width: "100%",
        }}

      >
        {!amount ? "Enter an amount" : "Undelegate"}
      </Button>
    </>
  );
};

export default Undelegate;
