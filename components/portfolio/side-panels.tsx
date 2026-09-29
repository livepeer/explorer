"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CircleDollarSign,
  Clock,
  Info,
  ShieldCheck,
  TrendingDown,
  Vote,
} from "lucide-react";
import Link from "next/link";

import { useIdentity } from "@/components/identity";
import { Card } from "@/components/page";
import { useStaking } from "@/components/staking/staking";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  formatDuration,
  formatLPT,
  formatUSD,
  shortAddress,
} from "@/lib/format";
import type { UnbondingLock } from "@/lib/subgraph/portfolio";

/* ── Projected earnings ──────────────────────────────────────────────────── */

export function Projections({
  rows,
  apr,
  commissionPerRound = 0,
  lptPrice,
}: {
  rows: { label: string; lpt: number }[];
  apr: number;
  commissionPerRound?: number;
  lptPrice?: number;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="text-ui-caption text-muted-foreground">
          At today&apos;s rate
        </span>
        <span className="font-mono text-ui-caption text-foreground tabular-nums">
          {apr.toFixed(2)}% APR
        </span>
      </div>
      <dl className="flex flex-col gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="text-ui-body text-muted-foreground">{r.label}</dt>
            <dd className="flex items-baseline gap-2 font-mono text-[13px] tabular-nums">
              <span>+{formatLPT(r.lpt)}</span>
              {lptPrice != null && (
                <span className="w-20 text-right text-ui-caption text-subtle-foreground">
                  {formatUSD(r.lpt * lptPrice)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[11px] leading-4 text-subtle-foreground">
        Compounded from your realised rewards over the last 30 rounds.
        {commissionPerRound > 0 &&
          ` Includes ~${formatLPT(
            commissionPerRound
          )} per round of reward-cut commission, projected flat.`}{" "}
        Inflation, reward calls and cuts all move this.
      </p>
    </Card>
  );
}

/* ── Undelegating (unbonding locks) ─────────────────────────────────────── */

export function PendingWithdrawals({
  locks,
  currentRound,
  roundSeconds,
  canManage,
}: {
  locks: UnbondingLock[];
  currentRound: number;
  roundSeconds: number;
  canManage: (address: string) => boolean;
}) {
  const { open } = useStaking();
  if (!locks.length) return null;
  const sorted = [...locks].sort((a, b) => a.withdrawRound - b.withdrawRound);
  return (
    <Card className="divide-y divide-(--hairline)">
      {sorted.map((l) => {
        const ready = l.withdrawRound <= currentRound;
        const roundsLeft = l.withdrawRound - currentRound;
        const manage = canManage(l.account);
        return (
          <div key={l.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[15px] tabular-nums">
                  {formatLPT(l.amount)}
                </span>
                <span className="flex items-center gap-1.5 text-ui-caption text-muted-foreground">
                  {ready ? (
                    <>
                      <span className="size-1.5 rounded-full bg-green-bright" />{" "}
                      Ready to withdraw
                    </>
                  ) : (
                    <>
                      <Clock className="size-3" /> Unlocks in ~
                      {formatDuration(roundsLeft * roundSeconds)} · round{" "}
                      {l.withdrawRound.toLocaleString()}
                    </>
                  )}
                </span>
              </div>
            </div>
            {manage && (
              <div className="flex gap-2">
                {ready && (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() =>
                      open({
                        kind: "withdrawStake",
                        account: l.account,
                        lockId: l.lockId,
                        amount: l.amount,
                      })
                    }
                  >
                    Withdraw
                  </Button>
                )}
                <Button
                  size="xs"
                  onClick={() =>
                    open({
                      kind: "rebond",
                      account: l.account,
                      lockId: l.lockId,
                      amount: l.amount,
                      delegate: l.delegate,
                    })
                  }
                >
                  Redelegate
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

/* ── Needs attention ─────────────────────────────────────────────────────── */

export type Insight = {
  id: string;
  tone: "warning" | "info" | "positive";
  kind: "missed" | "cut" | "inactive" | "withdraw" | "fees" | "safe" | "vote";
  orchestrator?: string;
  title: React.ReactNode;
  detail?: React.ReactNode;
  href?: string;
  /** Opens outside the explorer, in a new tab. */
  external?: boolean;
};

function OrchestratorName({ address }: { address: string }) {
  const { name } = useIdentity(address);
  return (
    <span className="text-foreground">{name ?? shortAddress(address)}</span>
  );
}

export function insightOrchestrator(address: string) {
  return <OrchestratorName address={address} />;
}

const ICONS = {
  missed: AlertTriangle,
  cut: TrendingDown,
  inactive: AlertTriangle,
  withdraw: Clock,
  fees: CircleDollarSign,
  safe: ShieldCheck,
  vote: Vote,
};

export function Insights({ items }: { items: Insight[] }) {
  if (!items.length) return null;
  return (
    <Card className="divide-y divide-(--hairline)">
      {items.map((i) => {
        const Icon =
          i.tone === "info" && i.kind !== "safe" && i.kind !== "vote"
            ? Info
            : ICONS[i.kind];
        const content = (
          <div className="flex items-start gap-3 px-4 py-3">
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                i.tone === "warning" && "bg-warm-subtle text-warm",
                i.tone === "positive" && "bg-green-subtle text-green-bright",
                i.tone === "info" && "bg-hover text-muted-foreground"
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-ui-body text-muted-foreground">{i.title}</p>
              {i.detail && (
                <p className="text-ui-caption text-subtle-foreground">
                  {i.detail}
                </p>
              )}
            </div>
            {i.href && (
              <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-subtle-foreground" />
            )}
          </div>
        );
        return i.href && i.external ? (
          <a
            key={i.id}
            href={i.href}
            target="_blank"
            rel="noreferrer"
            className="block transition-colors hover:bg-hover"
          >
            {content}
          </a>
        ) : i.href ? (
          <Link
            key={i.id}
            href={i.href}
            className="block transition-colors hover:bg-hover"
          >
            {content}
          </Link>
        ) : (
          <div key={i.id}>{content}</div>
        );
      })}
    </Card>
  );
}
