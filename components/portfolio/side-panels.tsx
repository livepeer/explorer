"use client";

import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowUpRight,
  CircleDollarSign,
  Clock,
  Info,
  ShieldCheck,
  TrendingDown,
  Vote,
} from "lucide-react";
import Link from "next/link";

import { useBridge } from "@/components/bridge/context";
import { Avatar, useIdentity } from "@/components/identity";
import { Card } from "@/components/page";
import { useNow } from "@/components/shell/round-clock";
import { useStaking } from "@/components/staking/staking";
import { Button } from "@/components/ui/button";
import { l1TxUrl, retryableUrl } from "@/lib/bridge/config";
import {
  depositTiming,
  waitText,
  withdrawalDay,
  withdrawalProgress,
} from "@/lib/bridge/progress";
import type { BridgeWithdrawal, TrackedDeposit } from "@/lib/bridge/types";
import { cn } from "@/lib/cn";
import { txUrl } from "@/lib/config";
import {
  formatDuration,
  formatETH,
  formatLPT,
  formatUSD,
  fromWei,
  shortAddress,
} from "@/lib/format";
import type { PortfolioAccount } from "@/lib/hooks/watchlist";
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
        <span className="text-ui-caption text-foreground tabular-nums">
          {apr.toFixed(2)}% from rewards
        </span>
      </div>
      <dl className="flex flex-col gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="text-ui-body text-muted-foreground">{r.label}</dt>
            <dd className="flex items-baseline gap-2 text-ui-body tabular-nums">
              {/* Under a ten-thousandth of an LPT (a leftover stake) a
                  projection is nothing to speak of, so it shows as a dash. */}
              {r.lpt >= 0.00005 ? (
                <span>+{formatLPT(r.lpt)}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              {lptPrice != null && (
                <span className="w-20 text-right text-ui-caption text-subtle-foreground">
                  {formatUSD(r.lpt * lptPrice)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-ui-caption leading-4 text-subtle-foreground">
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

function shortDate(unixSeconds: number) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });
}

/**
 * Whose row this is, on a page of several accounts: avatar and label, ENS
 * name, or short address, beside the amount so the two read together.
 */
function AccountTag({
  address,
  accounts,
}: {
  address: string;
  accounts: PortfolioAccount[];
}) {
  const { name, avatar } = useIdentity(address);
  const label = accounts.find(
    (a) => a.address.toLowerCase() === address.toLowerCase()
  )?.label;
  // Opens the account's page: everything for that one account.
  return (
    <Link
      href={`/accounts/${address.toLowerCase()}`}
      title={address}
      className="group flex min-w-0 items-center gap-1.5 rounded-sm text-ui-caption text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40"
    >
      <Avatar
        address={address}
        src={avatar}
        size={16}
        className="shrink-0 ring-1 ring-foreground/10"
      />
      <span className="truncate group-hover:underline">
        {label ?? name ?? shortAddress(address)}
      </span>
    </Link>
  );
}

/**
 * One pending item, in two lines: the amount (and whose, across accounts),
 * then what's happening. The right side always holds the next step: an
 * action when there is one, otherwise when it's due. Anything with a clock
 * gets a thin bar along the bottom.
 */
function PendingRow({
  amount,
  account,
  accounts,
  status,
  aside,
  progress,
}: {
  amount: string;
  account: string;
  accounts?: PortfolioAccount[];
  status: React.ReactNode;
  aside?: React.ReactNode;
  progress?: number;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-[15px] tabular-nums">{amount}</span>
            {accounts && <AccountTag address={account} accounts={accounts} />}
          </span>
          {/* Plain text flow, so spacing between its pieces stays even. */}
          <span className="min-w-0 text-ui-caption text-muted-foreground">
            {status}
          </span>
        </div>
        {aside && (
          <div className="flex shrink-0 items-center gap-2">{aside}</div>
        )}
      </div>
      {progress != null && (
        <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-hover">
          <div
            className="h-full rounded-full bg-muted-foreground/70 transition-[width]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * How long until it's done, on the right, read top to bottom as one
 * phrase: "Ready in" over "~3 days". The exact date is on hover.
 */
function Due({
  lead,
  when,
  title,
}: {
  lead: string;
  when: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className="flex flex-col items-end text-ui-caption text-muted-foreground"
    >
      {lead}
      <span className="text-ui-body text-foreground tabular-nums">{when}</span>
    </span>
  );
}

/** The icon that leads a status line, set inline with its text. */
const lead = "mr-1 inline size-3 align-[-2px]";

/** A transaction link inside a status line. */
function TxLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className="hover:text-foreground hover:underline"
    >
      {children}
    </a>
  );
}

function ReadyDot() {
  return (
    <span className="mr-1.5 mb-px inline-block size-1.5 rounded-full bg-green-fill align-middle" />
  );
}

export function PendingWithdrawals({
  locks,
  currentRound,
  roundSeconds,
  canManage,
  fees = [],
  bridge = [],
  deposits = [],
  ethPrice,
  accounts,
}: {
  locks: UnbondingLock[];
  currentRound: number;
  roundSeconds: number;
  canManage: (address: string) => boolean;
  /**
   * Unclaimed ETH fees, collected here alongside unlocked stake, so
   * everything you can take out of the protocol is in one place.
   */
  fees?: { account: string; amount: number }[];
  /** LPT bridged to Ethereum: claimable there, or still on its way. */
  bridge?: BridgeWithdrawal[];
  /** LPT bridged to Arbitrum, not arrived yet: on its way, or to retry. */
  deposits?: TrackedDeposit[];
  ethPrice?: number;
  /**
   * The accounts in view, when there are several: each row then names the
   * account it belongs to. Left out on one account's page.
   */
  accounts?: PortfolioAccount[];
}) {
  const { open } = useStaking();
  const { claim } = useBridge();
  const nowSec = Math.floor(useNow(30_000) / 1000);
  // A bridge transfer has two ends; name the one that's in view.
  const ours = (a: string, b: string) =>
    accounts?.some((x) => x.address.toLowerCase() === a.toLowerCase()) ? a : b;
  if (!locks.length && !fees.length && !bridge.length && !deposits.length) {
    return null;
  }
  const bridged = [...bridge].sort(
    (a, b) =>
      Number(b.status === "ready") - Number(a.status === "ready") ||
      a.timestamp - b.timestamp
  );
  const sorted = [...locks].sort((a, b) => a.withdrawRound - b.withdrawRound);
  return (
    <Card className="divide-y divide-(--hairline)">
      {fees.map((f) => (
        <PendingRow
          key={`fees-${f.account}`}
          amount={formatETH(f.amount)}
          account={f.account}
          accounts={accounts}
          status={
            <>
              <ReadyDot />
              Fees ready to withdraw
              {ethPrice != null && (
                <span className="tabular-nums">
                  {" "}
                  · ≈ {formatUSD(f.amount * ethPrice)}
                </span>
              )}
            </>
          }
          aside={
            canManage(f.account) && (
              <Button
                size="xs"
                variant="primary"
                onClick={() =>
                  open({
                    kind: "withdrawFees",
                    amount: f.amount,
                    account: f.account,
                  })
                }
              >
                Withdraw
              </Button>
            )
          }
        />
      ))}
      {deposits.map((d) => {
        const { minutesLeft, progress } = depositTiming(d.sentAt, nowSec);
        const amount = formatLPT(fromWei(BigInt(d.amount)));
        const account = ours(d.to, d.from);
        if (d.status === "retry") {
          return (
            <PendingRow
              key={`deposit-${d.l1Tx}-${d.seq ?? ""}`}
              amount={amount}
              account={account}
              accounts={accounts}
              status={
                <span className="text-warm">
                  <AlertTriangle className={lead} />
                  Arbitrum couldn&apos;t finish it · retry by{" "}
                  {shortDate(d.retryBy!)}
                </span>
              }
              // Anyone can retry it, on Arbitrum's tool; the LPT still goes
              // to the recipient.
              aside={
                <Button
                  size="xs"
                  variant="primary"
                  render={
                    <a
                      href={retryableUrl(d.l1Tx)}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  Retry <ArrowUpRight className="size-3" />
                </Button>
              }
            />
          );
        }
        return (
          <PendingRow
            key={`deposit-${d.l1Tx}-${d.seq ?? ""}`}
            amount={amount}
            account={account}
            accounts={accounts}
            status={
              <>
                <Clock className={lead} />
                Bridging to Arbitrum ·{" "}
                <TxLink href={l1TxUrl(d.l1Tx)} title="The deposit on Etherscan">
                  sent {shortDate(d.sentAt)}
                </TxLink>
              </>
            }
            aside={
              <Due
                lead="Arrives in"
                when={minutesLeft > 0 ? `~${minutesLeft} min` : "a moment"}
              />
            }
            progress={progress}
          />
        );
      })}
      {bridged.map((w) => {
        const ready = w.status === "ready";
        const sent = (
          <TxLink href={txUrl(w.tx)} title="The withdrawal on Arbiscan">
            sent {shortDate(w.timestamp)}
          </TxLink>
        );
        return (
          <PendingRow
            key={`bridge-${w.id}`}
            amount={formatLPT(fromWei(BigInt(w.amount)))}
            account={ours(w.to, w.from)}
            accounts={accounts}
            status={
              ready ? (
                <>
                  <ReadyDot />
                  Ready to claim on Ethereum · {sent}
                </>
              ) : (
                <>
                  <Clock className={lead} />
                  Bridging to Ethereum · {withdrawalDay(w, nowSec)} · {sent}
                </>
              )
            }
            // Any wallet can claim: the LPT goes to the recipient either way.
            aside={
              ready ? (
                <Button size="xs" variant="primary" onClick={() => claim(w)}>
                  Claim
                </Button>
              ) : (
                // The end of a withdrawal is a claim you make, so say so.
                <Due
                  lead="Claim in"
                  when={waitText(w.readyAt! - nowSec)}
                  title={`Claimable around ${shortDate(w.readyAt!)}`}
                />
              )
            }
            progress={ready ? undefined : withdrawalProgress(w, nowSec)}
          />
        );
      })}
      {sorted.map((l) => {
        const ready = l.withdrawRound <= currentRound;
        const roundsLeft = l.withdrawRound - currentRound;
        return (
          <PendingRow
            key={l.id}
            amount={formatLPT(l.amount)}
            account={l.account}
            accounts={accounts}
            status={
              ready ? (
                <>
                  <ReadyDot />
                  Ready to withdraw
                </>
              ) : (
                <>
                  <Clock className={lead} />
                  Unlocks in ~{formatDuration(roundsLeft * roundSeconds)} ·
                  round {l.withdrawRound.toLocaleString()}
                </>
              )
            }
            aside={
              canManage(l.account) && (
                <>
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
                </>
              )
            }
          />
        );
      })}
    </Card>
  );
}

/* ── Needs attention ─────────────────────────────────────────────────────── */

export type Insight = {
  id: string;
  tone: "warning" | "info" | "positive";
  kind:
    | "missed"
    | "cut"
    | "inactive"
    | "withdraw"
    | "fees"
    | "safe"
    | "vote"
    | "bridge";
  orchestrator?: string;
  title: React.ReactNode;
  detail?: React.ReactNode;
  href?: string;
  /** Opens outside the explorer, in a new tab. */
  external?: boolean;
  /** A button on the row, in place of a link (e.g. Claim). */
  action?: React.ReactNode;
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
  bridge: ArrowLeftRight,
};

export function Insights({ items }: { items: Insight[] }) {
  if (!items.length) return null;
  return (
    <Card className="divide-y divide-(--hairline)">
      {items.map((i) => {
        const Icon =
          i.tone === "info" &&
          i.kind !== "safe" &&
          i.kind !== "vote" &&
          i.kind !== "bridge"
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
            {i.action ? (
              <div className="shrink-0 self-center">{i.action}</div>
            ) : (
              i.href && (
                <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-subtle-foreground" />
              )
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
