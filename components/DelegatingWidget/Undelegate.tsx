import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@livepeer/design-system";
import { useAccountAddress } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import { parseEther } from "viem";
import { useSimulateContract } from "wagmi";

const Undelegate = ({ amount, newPosPrev, newPosNext, disabled }) => {
  const accountAddress = useAccountAddress();

  const args = {
    amount: parseEther(amount ? amount.toString() : "0"),
    newPosPrev,
    newPosNext,
  };

  const { data: bondingManagerAddress } = useBondingManagerAddress();

  const { data: config } = useSimulateContract({
    query: { enabled: Boolean(bondingManagerAddress) },
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "unbondWithHint",
    args: [BigInt(args.amount.toString()), newPosPrev, newPosNext],
  });

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button
        size="4"
        variant="red"
        disabled={disabled || !config}
        css={{
          width: "100%",
        }}
        // onClick={() => config && writeContract(config.request)}
      >
        {!amount ? "Enter an amount" : "Undelegate"}
      </Button>
    </>
  );
};

export default Undelegate;
