import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import { poll } from "@lib/api/abis/main/Poll";
import { Button } from "@livepeer/design-system";
import { useAccountAddress } from "hooks";
import { useLivepeerGovernorAddress } from "hooks/useContracts";
import { useHandleTransaction } from "hooks/useHandleTransaction";
import { useMemo } from "react";
import { Address } from "viem";
import {
  useSimulateContract,
  UseSimulateContractParameters,
  useWriteContract,
} from "wagmi";

type Props = React.ComponentProps<typeof Button> & {
  pollAddress?: Address;
  proposalId?: string;
  choiceId: number;
  reason?: string;
};

const Index = ({
  pollAddress,
  proposalId,
  choiceId,
  reason,
  children,
  ...props
}: Props) => {
  const accountAddress = useAccountAddress();
  const { data: livepeerGovernorAddress } = useLivepeerGovernorAddress();

  const preparedWriteConfig = useMemo<UseSimulateContractParameters>(() => {
    if (proposalId) {
      const hasReason = typeof reason === "string" && reason.length > 3;
      return {
        enabled: Boolean(accountAddress && livepeerGovernorAddress),
        address: livepeerGovernorAddress,
        abi: livepeerGovernor,
        functionName: hasReason ? "castVoteWithReason" : "castVote",
        args: hasReason
          ? [BigInt(proposalId), choiceId, reason]
          : [BigInt(proposalId), choiceId],
      };
    }
    return {
      enabled: Boolean(pollAddress && accountAddress),
      address: pollAddress,
      abi: poll,
      functionName: "vote",
      args: [BigInt(choiceId)],
    };
  }, [
    livepeerGovernorAddress,
    proposalId,
    pollAddress,
    choiceId,
    accountAddress,
    reason,
  ]);

  const { data: config } = useSimulateContract(preparedWriteConfig);
  const { data, isPending, writeContract, error, isSuccess } =
    useWriteContract();

  useHandleTransaction("vote", data, error, isPending, isSuccess, {
    choiceId,
    choiceName: proposalId
      ? { 0: "Against", 1: "For", 2: "Abstain" }[choiceId]
      : { 0: "No", 1: "Yes" }[choiceId],
    reason,
  });

  if (!accountAddress) {
    return null;
  }

  return (
    <Button
      disabled={!config}
      onClick={() => config && writeContract(config.request)}
      {...props}
    >
      {children}
    </Button>
  );
};

export default Index;
