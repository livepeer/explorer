"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowLeft, Check, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { encodeFunctionData, isAddress } from "viem";
import { normalize } from "viem/ens";
import { useAccount, useEnsAddress, useReadContract } from "wagmi";

import { PlainMarkdown } from "@/components/governance/markdown";
import { useControllerContract } from "@/components/governance/model";
import { useGovernanceTx } from "@/components/governance/use-governance-tx";
import { Card, EmptyState, Page, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input, Segmented } from "@/components/ui/misc";
import { SafeProposed } from "@/components/wallet/safe-proposed";
import { livepeerGovernor } from "@/lib/abis/LivepeerGovernor";
import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { cn } from "@/lib/cn";
import { L1_CHAIN, L2_CHAIN, txUrl } from "@/lib/config";
import { formatLPT, fromWei, shortAddress, toWei } from "@/lib/format";
import { useProtocolContract } from "@/lib/staking/contracts";

const TITLE_MAX = 120;

/**
 * A treasury proposal: `LivepeerGovernor.propose` with one call, an LPT
 * transfer from the treasury to the receiver. The description is markdown
 * whose first line is the title, the convention the proposal pages read.
 */
export default function NewProposalPage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const governor = useControllerContract("LivepeerGovernor");
  const treasury = useControllerContract("Treasury");
  const token = useProtocolContract("LivepeerToken");
  const tx = useGovernanceTx();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [view, setView] = useState<"write" | "preview">("write");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");

  const { data: balance } = useReadContract({
    address: token,
    abi: livepeerToken,
    functionName: "balanceOf",
    args: [treasury!],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(token && treasury) },
  });
  const { data: threshold } = useReadContract({
    address: governor,
    abi: livepeerGovernor,
    functionName: "proposalThreshold",
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(governor) },
  });
  // The governor checks votes as of the previous round.
  const { data: clock } = useReadContract({
    address: governor,
    abi: livepeerGovernor,
    functionName: "clock",
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(governor) },
  });
  const { data: votes } = useReadContract({
    address: governor,
    abi: livepeerGovernor,
    functionName: "getVotes",
    args: [address!, BigInt(Number(clock ?? 1) - 1)],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(governor && address && clock != null) },
  });

  // Receiver: an address, or an ENS name resolved on mainnet.
  const trimmed = receiver.trim();
  let ens: string | undefined;
  try {
    ens = /\.[a-z]{2,}$/i.test(trimmed) ? normalize(trimmed) : undefined;
  } catch {
    ens = undefined;
  }
  const { data: resolved, isFetching: resolving } = useEnsAddress({
    name: ens,
    chainId: L1_CHAIN.id,
    query: { enabled: Boolean(ens), retry: false },
  });
  const to = isAddress(trimmed) ? trimmed : resolved ?? undefined;
  const receiverError =
    trimmed && !to && !resolving
      ? ens
        ? "This name doesn't resolve to an address"
        : "Enter an address or ENS name"
      : null;

  let wei: bigint | null = null;
  try {
    wei = amount.trim() ? toWei(amount.trim()) : null;
  } catch {
    wei = null;
  }
  const treasuryLpt = balance != null ? (balance as bigint) : undefined;
  const amountError =
    amount.trim() && (wei == null || wei <= 0n)
      ? "Enter an amount of LPT"
      : wei != null && treasuryLpt != null && wei > treasuryLpt
      ? "More than the treasury holds"
      : null;

  const required = threshold as bigint | undefined;
  const have = (votes as bigint | undefined) ?? 0n;
  const eligible = required != null && have >= required;
  const complete =
    title.trim() && body.trim() && to && wei && wei > 0n && !amountError;
  const busy = tx.signing || tx.confirming;

  const description = `# ${title.trim()}\n\n${body.trim()}\n`;

  const submit = () => {
    if (!governor || !token || !to || !wei) return;
    tx.send({
      address: governor,
      abi: livepeerGovernor,
      functionName: "propose",
      args: [
        [token],
        [0n],
        [
          encodeFunctionData({
            abi: livepeerToken,
            functionName: "transfer",
            args: [to as `0x${string}`, wei],
          }),
        ],
        description,
      ],
    });
  };

  return (
    <Page className="max-w-[760px]">
      <Link
        href="/governance"
        className="mb-6 inline-flex items-center gap-1.5 text-ui-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Governance
      </Link>
      <PageHeader
        title="New treasury proposal"
        description="Ask the treasury to fund work. Stakeholders vote for 10 rounds after a 1-round delay; a proposal passes with a third of stake voting and more than half of For + Against in favor."
      />

      {tx.proposed && address ? (
        <Card className="px-5">
          <SafeProposed safe={address}>
            The proposal is queued in your Safe. Voting opens once the owners
            sign and execute it.
          </SafeProposed>
        </Card>
      ) : tx.confirmed ? (
        <Card>
          <EmptyState
            icon={<Check />}
            title="Proposal submitted"
            description="Voting opens after a one-round delay. It appears in Governance as soon as the network data catches up."
            action={
              <div className="flex gap-2">
                <Button size="sm" render={<Link href="/governance" />}>
                  Go to proposals
                </Button>
                {tx.hash && (
                  <Button
                    size="sm"
                    variant="ghost"
                    render={
                      <a
                        href={txUrl(tx.hash)}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  >
                    Arbiscan <ExternalLink />
                  </Button>
                )}
              </div>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              value={title}
              maxLength={TITLE_MAX}
              placeholder="e.g. Fund the Livepeer AI SPE for Q1"
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="body"
            aside={
              <Segmented
                size="xs"
                label="Description view"
                value={view}
                onChange={setView}
                options={[
                  { value: "write", label: "Write" },
                  { value: "preview", label: "Preview" },
                ]}
              />
            }
            hint="Markdown. Say what the funds are for, who receives them, milestones, and how progress will be reported."
          >
            {view === "write" ? (
              <textarea
                id="body"
                value={body}
                rows={14}
                onChange={(e) => setBody(e.target.value)}
                disabled={busy}
                placeholder={
                  "## Abstract\n\n## Motivation\n\n## Specification\n\n## Budget"
                }
                className="min-h-72 w-full resize-y rounded-sm border border-transparent bg-input/50 px-3 py-2.5 font-mono text-[13px] leading-6 outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40 disabled:opacity-50"
              />
            ) : (
              <div className="surface min-h-72 px-5 py-4">
                {title.trim() && (
                  <h2 className="mb-4 text-[20px] leading-7 font-medium">
                    {title.trim()}
                  </h2>
                )}
                {body.trim() ? (
                  <PlainMarkdown source={body} />
                ) : (
                  <p className="text-ui-body text-muted-foreground">
                    Nothing to preview yet.
                  </p>
                )}
              </div>
            )}
          </Field>

          <div className="grid gap-6 sm:grid-cols-[1fr_220px]">
            <Field
              label="Receiver"
              htmlFor="receiver"
              error={receiverError}
              hint={
                to && ens
                  ? `Resolves to ${to}`
                  : "The address the LPT is sent to if the proposal passes."
              }
            >
              <Input
                id="receiver"
                value={receiver}
                placeholder="0x… or name.eth"
                spellCheck={false}
                autoComplete="off"
                aria-invalid={Boolean(receiverError)}
                onChange={(e) => setReceiver(e.target.value)}
                disabled={busy}
              />
            </Field>
            <Field
              label="Amount"
              htmlFor="amount"
              error={amountError}
              hint={
                treasuryLpt != null
                  ? `Treasury holds ${formatLPT(fromWei(treasuryLpt))}`
                  : undefined
              }
            >
              <div className="relative">
                <Input
                  id="amount"
                  inputMode="decimal"
                  value={amount}
                  placeholder="0"
                  aria-invalid={Boolean(amountError)}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  disabled={busy}
                  className="pr-12 tabular-nums"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ui-caption text-muted-foreground">
                  LPT
                </span>
              </div>
            </Field>
          </div>

          <div className="flex flex-col items-end gap-2 border-t border-border pt-6">
            {tx.error && (
              <p className="text-ui-caption text-destructive">{tx.error}</p>
            )}
            {!isConnected ? (
              <Button variant="primary" onClick={() => openConnectModal?.()}>
                Connect wallet to propose
              </Button>
            ) : (
              <>
                {required != null && !eligible && (
                  <p className="text-right text-ui-caption text-muted-foreground">
                    Proposing needs {formatLPT(fromWei(required))} of voting
                    power as of last round. {shortAddress(address!)} has{" "}
                    {formatLPT(fromWei(have))}.
                  </p>
                )}
                <Button
                  variant="primary"
                  disabled={!complete || !eligible || busy || tx.checking}
                  onClick={submit}
                >
                  {busy && <Loader2 className="animate-spin" />}
                  {tx.signing
                    ? "Confirm in wallet…"
                    : tx.confirming
                    ? "Submitting…"
                    : "Submit proposal"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string | null;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-ui-body text-foreground">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {(error || hint) && (
        <p
          className={cn(
            "truncate text-ui-caption",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
