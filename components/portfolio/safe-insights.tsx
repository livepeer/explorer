"use client";

import { useIdentity } from "@/components/identity";
import { formatETH, formatLPT, fromWei, shortAddress } from "@/lib/format";
import type { PortfolioAccount } from "@/lib/hooks/watchlist";
import type { ProposalAction } from "@/lib/safe/proposals";
import { type SafeProposal, safeTxUrl } from "@/lib/safe/queue";

import { type Insight, insightOrchestrator } from "./side-panels";

function WalletName({ address, label }: { address: string; label?: string }) {
  const { name } = useIdentity(address);
  return (
    <span className="text-foreground">
      {label ?? name ?? shortAddress(address)}
    </span>
  );
}

const SUPPORT = ["Against", "For", "Abstain"];

/** The proposal in a phrase; an approval alongside a delegation is implied. */
function summary(actions: ProposalAction[]): React.ReactNode {
  const main = actions.find((a) => a.kind !== "approve") ?? actions[0];
  switch (main.kind) {
    case "delegate":
      return (
        <>
          Delegate {formatLPT(fromWei(main.amount))} to{" "}
          {insightOrchestrator(main.to)}
        </>
      );
    case "undelegate":
      return <>Undelegate {formatLPT(fromWei(main.amount))}</>;
    case "redelegate":
      return main.to ? (
        <>Redelegate unlocked stake to {insightOrchestrator(main.to)}</>
      ) : (
        <>Redelegate unlocked stake</>
      );
    case "withdrawStake":
      return <>Withdraw unlocked stake</>;
    case "withdrawFees":
      return <>Withdraw {formatETH(fromWei(main.amount))} in fees</>;
    case "approve":
      return <>Approve {formatLPT(fromWei(main.amount))} for delegating</>;
    case "treasuryVote":
      return (
        <>
          Vote{" "}
          <span className="text-foreground">
            {SUPPORT[main.support] ?? "on"}
          </span>{" "}
          on a treasury proposal
        </>
      );
    case "pollVote":
      return (
        <>
          Vote{" "}
          <span className="text-foreground">
            {main.choice === 0n ? "Yes" : "No"}
          </span>{" "}
          on an LIP poll
        </>
      );
  }
}

/**
 * Livepeer actions waiting in one of the portfolio's Safes, most complete
 * first. Each links to the transaction in Safe{Wallet} to sign or execute.
 */
export function safeInsights(
  proposals: SafeProposal[],
  accounts: PortfolioAccount[]
): Insight[] {
  return [...proposals]
    .sort(
      (a, b) =>
        b.confirmations / b.required - a.confirmations / a.required ||
        a.nonce - b.nonce
    )
    .map((p) => {
      const ready = p.confirmations >= p.required;
      const label = accounts.find((a) => a.address === p.safe)?.label;
      return {
        id: `safe-${p.id}`,
        tone: "info" as const,
        kind: "safe" as const,
        href: safeTxUrl(p.safe, p.id),
        external: true,
        title: (
          <>
            {summary(p.actions)} is waiting in{" "}
            <WalletName address={p.safe} label={label} />
          </>
        ),
        detail: ready
          ? `All ${p.required} signatures in. Ready to execute in Safe`
          : `${p.confirmations} of ${p.required} signatures · Sign in Safe`,
      };
    });
}
