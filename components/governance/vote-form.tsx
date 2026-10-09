"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { SafeProposed } from "@/components/wallet/safe-proposed";
import { poll as pollAbi } from "@/lib/abis/Poll";
import { cn } from "@/lib/cn";
import { L2_CHAIN, txUrl } from "@/lib/config";
import { useIsSafe } from "@/lib/hooks/safe";
import { refreshWhenIndexed } from "@/lib/subgraph/sync";

type Hash = `0x${string}`;

function errorMessage(e: unknown) {
  const msg =
    e instanceof Error
      ? (e as { shortMessage?: string }).shortMessage ?? e.message
      : String(e);
  if (/user rejected|denied/i.test(msg)) return "Request rejected in wallet";
  return msg.split("\n")[0];
}

/**
 * Choice buttons, optional reason, one primary action. The parent supplies
 * `send`, which submits the transaction and resolves with its hash; this
 * component owns wallet/chain gating, tx stages and the confirmation toast.
 */
export function VoteForm({
  choices,
  withReason = false,
  send,
  successTitle = "Vote cast",
  onConfirmed,
  note,
}: {
  choices: { value: number; label: string }[];
  withReason?: boolean;
  send: (choice: number, reason: string) => Promise<Hash>;
  successTitle?: string;
  onConfirmed?: () => void;
  note?: React.ReactNode;
}) {
  const { isConnected, chainId, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const queryClient = useQueryClient();
  const reasonId = useId();

  const [choice, setChoice] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [signing, setSigning] = useState(false);
  const [hash, setHash] = useState<Hash | undefined>();
  const [error, setError] = useState<string | null>(null);
  const isSafe = useIsSafe();
  // A Safe hands back a proposal's hash: there's no receipt to wait for.
  const receipt = useWaitForTransactionReceipt({
    hash: isSafe ? undefined : hash,
    chainId: L2_CHAIN.id,
  });

  useEffect(() => {
    if (!receipt.isSuccess || !hash) return;
    const h = hash;
    const view = {
      label: "View",
      onClick: () => window.open(txUrl(h), "_blank"),
    };
    const id = toast.loading(`${successTitle} · updating tallies…`, {
      action: view,
    });
    refreshWhenIndexed(queryClient, receipt.data?.blockNumber, [
      ["governance"],
      ["events"],
      ["votes"],
    ]).then((indexed) =>
      toast.success(successTitle, {
        id,
        action: view,
        description: indexed
          ? undefined
          : "Still indexing. Tallies will catch up shortly.",
      })
    );
    onConfirmed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  useEffect(() => {
    if (receipt.isError) setError(errorMessage(receipt.error));
  }, [receipt.isError, receipt.error]);

  if (!isConnected) {
    return (
      <Button
        variant="primary"
        className="w-full"
        onClick={() => openConnectModal?.()}
      >
        Connect wallet to vote
      </Button>
    );
  }

  if (isSafe && hash && address) {
    return (
      <div className="rounded-md bg-hover px-3">
        <SafeProposed
          safe={address}
          id={hash}
          onExecuted={(block) => {
            refreshWhenIndexed(queryClient, block, [
              ["governance"],
              ["events"],
              ["votes"],
            ]);
            onConfirmed?.();
          }}
        >
          Your vote is queued in your Safe. It counts once the owners sign and
          execute it before voting ends.
        </SafeProposed>
      </div>
    );
  }

  if (receipt.isSuccess && hash) {
    return (
      <div className="flex flex-col gap-2 rounded-md bg-hover px-3 py-3">
        <p className="flex items-center gap-2 text-ui-body font-medium">
          <Check className="size-4 text-green-bright" /> {successTitle}
        </p>
        <a
          href={txUrl(hash)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-ui-caption text-muted-foreground hover:text-foreground"
        >
          View transaction <ExternalLink className="size-3" />
        </a>
      </div>
    );
  }

  const confirming = !isSafe && Boolean(hash) && receipt.isLoading;
  const busy = signing || confirming;
  const wrongChain = chainId !== L2_CHAIN.id;

  const submit = async () => {
    if (choice == null) return;
    setError(null);
    setSigning(true);
    try {
      setHash(await send(choice, reason.trim()));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label="Your vote"
        className={cn(
          "grid gap-2",
          choices.length === 2 ? "grid-cols-2" : "grid-cols-3"
        )}
      >
        {choices.map((c) => {
          const selected = choice === c.value;
          return (
            <Button
              key={c.value}
              role="radio"
              aria-checked={selected}
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setChoice(c.value)}
              className={cn(
                selected && "border-foreground bg-accent text-foreground"
              )}
            >
              {selected && <Check />}
              {c.label}
            </Button>
          );
        })}
      </div>

      {withReason && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={reasonId}
            className="text-ui-caption text-muted-foreground"
          >
            Reason{" "}
            <span className="text-subtle-foreground">
              (optional, stored on-chain)
            </span>
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
            rows={3}
            placeholder="Why you're voting this way"
            className="min-h-20 w-full resize-y rounded-sm border border-transparent bg-input/50 px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40 disabled:opacity-50 md:text-sm"
          />
        </div>
      )}

      {note}

      {wrongChain ? (
        <Button
          variant="primary"
          className="w-full"
          disabled={switching}
          onClick={() =>
            switchChainAsync({ chainId: L2_CHAIN.id }).catch((e) =>
              setError(errorMessage(e))
            )
          }
        >
          {switching && <Loader2 className="animate-spin" />}
          Switch to Arbitrum
        </Button>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          disabled={choice == null || busy || isSafe === undefined}
          onClick={submit}
        >
          {busy && <Loader2 className="animate-spin" />}
          {signing
            ? "Confirm in wallet…"
            : confirming
            ? "Confirming…"
            : "Cast vote"}
        </Button>
      )}

      {error && (
        <p className="text-ui-caption break-words text-destructive">{error}</p>
      )}
      {hash && confirming && (
        <a
          href={txUrl(hash)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 self-end text-[11px] text-muted-foreground hover:text-foreground"
        >
          Pending transaction <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}

/** LIP poll ballot: `Poll.vote(choiceId)` where 0 = Yes, 1 = No. */
export function PollVoteForm({ pollAddress }: { pollAddress: string }) {
  const { writeContractAsync } = useWriteContract();
  return (
    <VoteForm
      choices={[
        { value: 0, label: "Yes" },
        { value: 1, label: "No" },
      ]}
      send={(choice) =>
        writeContractAsync({
          address: pollAddress as Hash,
          abi: pollAbi,
          functionName: "vote",
          args: [BigInt(choice)],
          chainId: L2_CHAIN.id,
        })
      }
      note={
        <p className="text-ui-caption text-muted-foreground">
          Votes are weighted by stake. You can change your vote until the poll
          ends.
        </p>
      }
    />
  );
}
