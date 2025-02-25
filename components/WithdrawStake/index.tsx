import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { Button } from "@jjasonn.stone/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import { useBondingManagerAddress } from "hooks/useContracts";
import {
  useSimulateContract,
  useWriteContract,
} from "wagmi";
import { useState } from "react";
import { type Address } from "viem";

type Props = {
  unbondingLockId: number;
};

const Index = ({ unbondingLockId }: Props) => {
  const accountAddress = useAccountAddress();
  const { data: bondingManagerAddress } = useBondingManagerAddress();
  const [txError, setTxError] = useState<Error | null>(null);

  const { data: simulateData } = useSimulateContract({
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "withdrawStake",
    args: [BigInt(unbondingLockId)],
    query: {
      enabled: Boolean(bondingManagerAddress && accountAddress)
    }
  });

  const { writeContract, isPending, data: writeData } = useWriteContract();

  useHandleTransaction(
    "withdrawStake",
    { hash: writeData },
    txError,
    isPending,
    Boolean(writeData),
    {
      unbondingLockId,
    }
  );

  const handleClick = async () => {
    try {
      if (simulateData?.request) {
        writeContract(simulateData.request);
        setTxError(null);
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      setTxError(error as Error);
    }
  };

  if (!accountAddress) {
    return null;
  }

  return (
    <>
      <Button
        variant="primary"
        size="3"
        onClick={handleClick}
        disabled={!simulateData?.request || isPending}
        css={{ py: "$2", mr: "$3" }}
      >
        Withdraw
      </Button>
    </>
  );
};

export default Index;
