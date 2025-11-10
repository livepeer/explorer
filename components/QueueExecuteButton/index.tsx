import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import { Button } from "@livepeer/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import {
  UseSimulateContractParameters,
  useReadContract,
  useWriteContract,
  useSimulateContract,
} from "wagmi";
import { Address } from "viem";

import { useMemo } from "react";
import { useLivepeerGovernorAddress } from "hooks/useContracts";
import { ProposalExtended } from "@lib/api/treasury";
import { ethers } from "ethers";

type Props = {
  action: "queue" | "execute";
  proposal: ProposalExtended;
  onClick?: () => void;
};

const keccak256 = (input: string) =>
  ethers.utils.solidityKeccak256(["string"], [input ?? ""]);

const QueueExecuteButton = (
  allProps: Props & React.ComponentProps<typeof Button>
) => {
  const { action, proposal, onClick, ...props } = allProps as Props;
  const accountAddress = useAccountAddress();
  const { data: livepeerGovernorAddress } = useLivepeerGovernorAddress();

  const { data: eta } = useReadContract({
    query: { enabled: Boolean(livepeerGovernorAddress && proposal) },
    address: livepeerGovernorAddress,
    abi: livepeerGovernor,
    functionName: "proposalEta",
    args: [BigInt(proposal?.id ?? 0)],
  });

  const enabled =
    Boolean(livepeerGovernorAddress && accountAddress && proposal) &&
    (action === "queue"
      ? proposal.state === "Succeeded" // only enable queue if proposal is explicitly in Succeeded state
      : Boolean(eta) && Date.now() >= eta! * 1000n);

  const preparedWriteConfig = useMemo<UseSimulateContractParameters>(
    () => ({
      enabled,
      address: livepeerGovernorAddress,
      abi: livepeerGovernor,
      functionName: action,
      value: 0n,
      args: [
        proposal?.targets as Address[],
        proposal?.values.map((v) => BigInt(v)),
        proposal?.calldatas,
        keccak256(proposal?.description),
      ],
    }),
    [action, enabled, livepeerGovernorAddress, proposal]
  );
  const { data: config } = useSimulateContract(preparedWriteConfig);
  const { data, isPending, writeContract, error, isSuccess } =
    useWriteContract();

  useHandleTransaction(action, data, error, isPending, isSuccess, {
    proposal,
  });

  if (!accountAddress) {
    return null;
  }

  return (
    <Button
      onClick={() => {
        if (!config) return;
        writeContract(config.request);
        onClick?.();
      }}
      disabled={!enabled}
      {...props}
    >
      {action === "execute" ? "Execute" : "Enqueue"}
    </Button>
  );
};

export default QueueExecuteButton;
