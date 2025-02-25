import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import { Button } from "@jjasonn.stone/design-system";
import { useAccountAddress, useHandleTransaction } from "hooks";
import {
  useSimulateContract,
  useReadContract,
  useWriteContract,
} from "wagmi";

import { useLivepeerGovernorAddress } from "hooks/useContracts";
import { ProposalExtended } from "@lib/api/treasury";
import { keccak256 as ethersKeccak256, toUtf8Bytes } from "ethers";
import { Address } from "viem";

type Props = {
  action: "queue" | "execute";
  proposal: ProposalExtended;
  onClick?: () => void;
};

const keccak256 = (input: string): `0x${string}` => {
  const hash = ethersKeccak256(toUtf8Bytes(input ?? ""));
  return hash as `0x${string}`;
};

const QueueExecuteButton = (
  allProps: Props & React.ComponentProps<typeof Button>
) => {
  const { action, proposal, onClick, ...props } = allProps as Props;
  const accountAddress = useAccountAddress();
  const { data: livepeerGovernorAddress } = useLivepeerGovernorAddress();

  const { data: eta } = useReadContract({
    address: livepeerGovernorAddress,
    abi: livepeerGovernor,
    functionName: "proposalEta",
    args: [BigInt(proposal?.id ?? 0)],
    query: {
      enabled: Boolean(livepeerGovernorAddress && proposal)
    },
  });

  const enabled =
    Boolean(livepeerGovernorAddress && accountAddress && proposal) &&
    (action === "queue"
      ? proposal.state === "Succeeded" // only enable queue if proposal is explicitly in Succeeded state
      : Boolean(eta) && Date.now() >= eta! * 1000n);

  const { data: simulateData } = useSimulateContract({
    address: livepeerGovernorAddress,
    abi: livepeerGovernor,
    functionName: action,
    args: [
      proposal?.targets as Address[],
      proposal?.values.map((v) => BigInt(v)),
      proposal?.calldatas,
      keccak256(proposal?.description),
    ],
    query: {
      enabled
    }
  });

  const { writeContract, data, isPending, error, isSuccess } = useWriteContract();

  const handleWrite = () => {
    if (!simulateData) return;
    writeContract({
      address: livepeerGovernorAddress as Address,
      abi: livepeerGovernor,
      functionName: action,
      args: [
        proposal?.targets as Address[],
        proposal?.values.map((v) => BigInt(v)),
        proposal?.calldatas,
        keccak256(proposal?.description),
      ]
    });
  };

  useHandleTransaction(action, data ? { hash: data } : undefined, error, isPending, isSuccess, {
    proposal,
  });

  if (!accountAddress) {
    return null;
  }

  return (
    <Button
      onClick={() => {
        handleWrite();
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
