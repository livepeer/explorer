import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import { poll } from "@lib/api/abis/main/Poll";
import { Button } from "@jjasonn.stone/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import {
  useSimulateContract,
  useWriteContract,
} from "wagmi";
import { useState } from "react";
import { type Address } from "viem";
import { useLivepeerGovernorAddress } from "hooks/useContracts";

type Props = React.ComponentProps<typeof Button> & {
  pollAddress?: Address;
  proposalId?: string;
  choiceId: number;
};

const Index = ({
  pollAddress,
  proposalId,
  choiceId,
  children,
  ...props
}: Props) => {
  const accountAddress = useAccountAddress();
  const { data: livepeerGovernorAddress } = useLivepeerGovernorAddress();

  const { data: governorSimulateData } = useSimulateContract({
    address: livepeerGovernorAddress,
    abi: livepeerGovernor,
    functionName: "castVote",
    args: [BigInt(proposalId || "0"), Number(choiceId)],
    query: {
      enabled: Boolean(livepeerGovernorAddress && accountAddress && proposalId)
    }
  });

  const { data: pollSimulateData } = useSimulateContract({
    address: pollAddress,
    abi: poll,
    functionName: "vote",
    args: [BigInt(choiceId)],
    query: {
      enabled: Boolean(pollAddress && accountAddress && !proposalId)
    }
  });

  const { writeContract, isPending, data: writeData } = useWriteContract();
  const [txError, setTxError] = useState<Error | null>(null);

  useHandleTransaction(
    "vote",
    { hash: writeData },
    txError,
    isPending,
    Boolean(writeData),
    {
      choiceId,
      choiceName: proposalId
        ? { 0: "Against", 1: "For", 2: "Abstain" }[choiceId]
        : { 0: "No", 1: "Yes" }[choiceId],
    }
  );

  const handleClick = async () => {
    try {
      if (proposalId && governorSimulateData?.request) {
        writeContract(governorSimulateData.request);
        setTxError(null);
      } else if (!proposalId && pollSimulateData?.request) {
        writeContract(pollSimulateData.request);
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

  const canSubmit = proposalId 
    ? Boolean(governorSimulateData?.request)
    : Boolean(pollSimulateData?.request);

  return (
    <Button
      {...props}
      disabled={Boolean(!canSubmit || isPending)}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
};

export default Index;
