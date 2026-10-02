"use client";

import { Check, ExternalLink, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount, useCallsStatus } from "wagmi";

import { cn } from "@/lib/cn";
import { safeAppUrl, safeQueueUrl } from "@/lib/hooks/safe";

/**
 * Follows a proposal inside Safe{Wallet}, whose provider reports its status
 * (EIP-5792 `wallet_getCallsStatus`) until the owners execute it.
 */
function ProposalStatus({
  id,
  onExecuted,
}: {
  id: string;
  onExecuted: (block?: bigint) => void;
}) {
  const { data } = useCallsStatus({
    id,
    query: {
      refetchInterval: (q) =>
        !q.state.data || q.state.data.status === "pending" ? 10_000 : false,
    },
  });
  const status = data?.status;
  const block = data?.receipts?.[0]?.blockNumber;

  useEffect(() => {
    if (status === "success") onExecuted(block);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const [Icon, label, tone] =
    status === "success"
      ? [Check, "Executed on-chain", "text-green-bright"]
      : status === "failure"
      ? [X, "Rejected or failed in your Safe", "text-destructive"]
      : [Loader2, "Waiting for your Safe's owners to sign", ""];
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-hover px-3 py-1 text-ui-caption text-muted-foreground",
        tone
      )}
    >
      <Icon className={cn("size-3.5", Icon === Loader2 && "animate-spin")} />
      {label}
    </p>
  );
}

/**
 * Shown once a Safe has queued a transaction: it still needs its owners'
 * signatures before anything happens on-chain. Inside Safe{Wallet} it keeps
 * following the proposal until it executes.
 */
export function SafeProposed({
  safe,
  id,
  onExecuted,
  children,
}: {
  safe: string;
  /** The proposal's hash, to follow it when connected as a Safe App. */
  id?: string;
  onExecuted?: (block?: bigint) => void;
  children?: React.ReactNode;
}) {
  const { connector } = useAccount();
  const safeApp = connector?.id === "safe";
  const [executed, setExecuted] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-hover text-foreground">
        <ShieldCheck className="size-6" />
      </span>
      <p className="max-w-[40ch] text-ui-body text-balance text-muted-foreground">
        {executed
          ? "Your Safe executed it. The explorer is catching up with the new figures."
          : children ??
            "Your Safe's owners need to sign and execute it. The explorer updates once it's on-chain."}
      </p>
      {safeApp && id && (
        <ProposalStatus
          id={id}
          onExecuted={(block) => {
            setExecuted(true);
            onExecuted?.(block);
          }}
        />
      )}
      <a
        href={safeQueueUrl(safe)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-ui-caption text-foreground underline-offset-4 hover:underline"
      >
        Open your Safe&apos;s queue <ExternalLink className="size-3" />
      </a>
      {!safeApp && (
        <p className="text-[11px] text-subtle-foreground">
          Next time, use the explorer inside your Safe.{" "}
          <a
            href={safeAppUrl(safe)}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Open as Safe App
          </a>
        </p>
      )}
    </div>
  );
}
