"use client";

import {
  ArrowRightLeft,
  Eye,
  Minus,
  MoreHorizontal,
  Plus,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Sparkline } from "@/components/charts/time-series";
import { Avatar, Identity, useIdentity } from "@/components/identity";
import { Card, EmptyState } from "@/components/page";
import { useStaking } from "@/components/staking/staking";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { formatETH, formatLPT, formatNumber, shortAddress } from "@/lib/format";
import type { PortfolioAccount } from "@/lib/hooks/watchlist";
import type { Orchestrator } from "@/lib/subgraph/network";

export type Position = {
  account: PortfolioAccount;
  delegate: string | null;
  stake: number;
  fees: number;
  rewards30d: number;
  trend: number[];
  active: boolean;
};

function AccountCell({ account }: { account: PortfolioAccount }) {
  const { name, avatar } = useIdentity(account.address);
  return (
    <Link
      href={`/accounts/${account.address}`}
      className="flex min-w-0 items-center gap-2.5 rounded-sm outline-none hover:opacity-80"
    >
      <Avatar address={account.address} src={avatar} size={26} />
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1.5 truncate text-ui-body">
          {account.label ?? name ?? (
            <span className="font-mono text-[13px]">
              {shortAddress(account.address)}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 text-[11px] whitespace-nowrap text-muted-foreground">
          {account.connected ? (
            <>
              <span className="size-1.5 shrink-0 rounded-full bg-green-bright" />
              Connected
            </>
          ) : account.label || name ? (
            <span className="font-mono">{shortAddress(account.address)}</span>
          ) : (
            "Not connected"
          )}
        </span>
      </span>
    </Link>
  );
}

function RowActions({
  position,
  canManage,
}: {
  position: Position;
  canManage: boolean;
}) {
  const { open } = useStaking();
  if (!canManage) {
    return (
      <Tooltip content="Add this address to your portfolio to manage it here.">
        <span className="inline-flex size-8 items-center justify-center text-subtle-foreground">
          <Eye className="size-4" />
        </span>
      </Tooltip>
    );
  }
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Position actions">
            <MoreHorizontal />
          </Button>
        }
      />
      <MenuContent>
        {position.delegate && (
          <MenuItem
            onClick={() =>
              open({
                kind: "delegate",
                to: position.delegate!,
                account: position.account.address,
              })
            }
          >
            <Plus /> Delegate more
          </MenuItem>
        )}
        <MenuItem render={<Link href="/orchestrators?move=1" />}>
          <ArrowRightLeft /> Switch orchestrator
        </MenuItem>
        {position.delegate && position.stake > 0 && (
          <MenuItem
            onClick={() =>
              open({
                kind: "undelegate",
                account: position.account.address,
                delegate: position.delegate!,
                staked: position.stake,
              })
            }
          >
            <Minus /> Undelegate
          </MenuItem>
        )}
        {position.fees > 0 && (
          <>
            <MenuSeparator />
            <MenuItem
              onClick={() =>
                open({
                  kind: "withdrawFees",
                  amount: position.fees,
                  account: position.account.address,
                })
              }
            >
              <Wallet /> Withdraw {formatETH(position.fees)}
            </MenuItem>
          </>
        )}
      </MenuContent>
    </Menu>
  );
}

export function Positions({
  positions,
  orchestrators,
  total,
  canManage,
  showAccount,
}: {
  positions: Position[];
  orchestrators: Map<string, Orchestrator>;
  total: number;
  canManage: (address: string) => boolean;
  showAccount: boolean;
}) {
  if (!positions.length) {
    return (
      <Card>
        <EmptyState
          title="No stake yet"
          description="Delegate LPT to an orchestrator to start earning rewards and fees."
          action={
            <Link
              href="/orchestrators"
              className="btn-primary inline-flex h-8 items-center rounded-sm px-3 text-sm font-medium"
            >
              Browse orchestrators
            </Link>
          }
        />
      </Card>
    );
  }

  // Sized by the space the section gets, not the screen: beside the side
  // panels a desktop column can be narrower than the full table needs.
  return (
    <div className="@container">
      {/* Narrow: one card per position, figures stacked under the names. */}
      <Card className="divide-y divide-(--hairline) @min-[44rem]:hidden">
        {positions.map((p) => {
          const o = p.delegate ? orchestrators.get(p.delegate) : undefined;
          return (
            <div key={p.account.address} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                {showAccount ? (
                  <AccountCell account={p.account} />
                ) : p.delegate ? (
                  <Identity
                    address={p.delegate}
                    href={`/orchestrators/${p.delegate}`}
                    size={26}
                  />
                ) : null}
                <RowActions
                  position={p}
                  canManage={canManage(p.account.address)}
                />
              </div>
              {showAccount && p.delegate && (
                <div className="flex items-center gap-2 text-ui-caption text-muted-foreground">
                  <span>Delegated to</span>
                  <Identity
                    address={p.delegate}
                    href={`/orchestrators/${p.delegate}`}
                    size={18}
                  />
                  {!p.active && <Badge tone="warning">Inactive</Badge>}
                </div>
              )}
              <dl className="grid grid-cols-3 gap-3">
                {[
                  ["Stake", formatLPT(p.stake)],
                  [
                    "30d rewards",
                    `${p.rewards30d > 0 ? "+" : ""}${formatLPT(p.rewards30d)}`,
                  ],
                  ["Fees", p.fees > 0 ? formatETH(p.fees) : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex min-w-0 flex-col gap-0.5">
                    <dt className="text-[11px] text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="truncate font-mono text-[12.5px] tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {o && (
                <p className="text-[11px] text-subtle-foreground">
                  {formatNumber(o.rewardCut, { decimals: 0 })}% cut ·{" "}
                  {formatNumber(o.feeShare, { decimals: 0 })}% fee share
                </p>
              )}
            </div>
          );
        })}
      </Card>

      {/* Wider: a table, adding columns as they fit, actions always in view. */}
      <Card className="hidden overflow-x-auto @min-[44rem]:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-hairline text-ui-caption whitespace-nowrap text-muted-foreground">
              {showAccount && (
                <th className="px-3 py-2.5 font-normal">Account</th>
              )}
              <th className="px-3 py-2.5 font-normal">Orchestrator</th>
              <th className="px-3 py-2.5 text-right font-normal">Stake</th>
              <th className="hidden px-3 py-2.5 text-right font-normal @min-[46rem]:table-cell">
                30d rewards
              </th>
              <th className="px-3 py-2.5 text-right font-normal">
                Unclaimed fees
              </th>
              <th className="hidden px-3 py-2.5 font-normal @min-[58rem]:table-cell">
                Trend
              </th>
              <th className="w-12 px-2 py-2.5" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const o = p.delegate ? orchestrators.get(p.delegate) : undefined;
              const weight = total > 0 ? (p.stake / total) * 100 : 0;
              return (
                <tr
                  key={p.account.address}
                  className="border-b border-hairline last:border-0 hover:bg-hover/60"
                >
                  {showAccount && (
                    <td className="px-3 py-3">
                      <AccountCell account={p.account} />
                    </td>
                  )}
                  <td className="px-3 py-3">
                    {p.delegate ? (
                      <div className="flex items-center gap-2">
                        <Identity
                          address={p.delegate}
                          href={`/orchestrators/${p.delegate}`}
                          size={22}
                          secondary={
                            o
                              ? `${formatNumber(o.rewardCut, {
                                  decimals: 0,
                                })}% cut · ${formatNumber(o.feeShare, {
                                  decimals: 0,
                                })}% fee share`
                              : undefined
                          }
                        />
                        {!p.active && (
                          <Badge tone="warning" className="ml-1">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-ui-body text-muted-foreground">
                        Not delegated
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="font-mono text-[13px] whitespace-nowrap tabular-nums">
                      {formatLPT(p.stake)}
                    </div>
                    {showAccount && (
                      <div className="mt-0.5 text-[11px] whitespace-nowrap text-muted-foreground">
                        {weight > 0 && weight < 1
                          ? "<1%"
                          : `${formatNumber(weight, { decimals: 0 })}%`}{" "}
                        of total
                      </div>
                    )}
                  </td>
                  <td className="hidden px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap tabular-nums @min-[46rem]:table-cell">
                    <span
                      className={cn(
                        p.rewards30d > 0
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {p.rewards30d > 0 ? "+" : ""}
                      {formatLPT(p.rewards30d)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
                    {p.fees > 0 ? (
                      <span className="text-foreground">
                        {formatETH(p.fees)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="hidden px-3 py-3 @min-[58rem]:table-cell">
                    <Sparkline values={p.trend} color="var(--series-1)" />
                  </td>
                  <td className="px-2 py-3 text-right">
                    <RowActions
                      position={p}
                      canManage={canManage(p.account.address)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/** Orchestrator name on one line, its terms free to wrap underneath. */
function OrchestratorHeader({
  address,
  terms,
}: {
  address: string;
  terms: string[];
}) {
  const { name, avatar, display } = useIdentity(address);
  return (
    <Link
      href={`/orchestrators/${address}`}
      className="group flex min-w-0 items-center gap-3 rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-green-bright/40"
    >
      <Avatar address={address} src={avatar} size={40} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          title={address}
          className={cn(
            "truncate text-[15px] text-foreground group-hover:underline",
            !name && "font-mono text-[14px]"
          )}
          style={{ textUnderlineOffset: 4 }}
        >
          {display}
        </span>
        {terms.length > 0 && (
          <span className="text-ui-caption text-muted-foreground">
            {terms.join(" · ")}
          </span>
        )}
      </span>
    </Link>
  );
}

function Figure({
  label,
  children,
  action,
}: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-ui-caption text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="truncate font-mono text-[15px] tabular-nums">
          {children}
        </span>
        {action}
      </dd>
    </div>
  );
}

/**
 * One account's delegation. An account delegates to exactly one
 * orchestrator, so a single account gets this card rather than a table:
 * the orchestrator up top, the figures beneath, actions inline.
 */
export function DelegationCard({
  position: p,
  orchestrator: o,
  canManage,
}: {
  position: Position;
  orchestrator: Orchestrator | undefined;
  canManage: boolean;
}) {
  const { open } = useStaking();
  const account = p.account.address;

  if (!p.delegate) {
    return (
      <Card>
        <EmptyState
          title="Not delegated"
          description={
            canManage
              ? "Delegate LPT to an orchestrator to start earning rewards and fees."
              : "This account doesn't delegate to an orchestrator right now."
          }
          action={
            canManage ? (
              <Link
                href="/orchestrators"
                className="btn-primary inline-flex h-8 items-center rounded-sm px-3 text-sm font-medium"
              >
                Browse orchestrators
              </Link>
            ) : undefined
          }
        />
      </Card>
    );
  }

  const terms = o
    ? [
        `${formatNumber(o.rewardCut, { decimals: 0 })}% reward cut`,
        `${formatNumber(o.feeShare, { decimals: 0 })}% fee share`,
        `${o.rewardCalls}/${o.rewardWindow} reward calls`,
      ]
    : [];

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-4 p-5">
        <OrchestratorHeader address={p.delegate} terms={terms} />
        <div className="flex shrink-0 items-center gap-3">
          {!canManage && (
            <Tooltip content="Connect this wallet once to manage it here.">
              <span className="hidden items-center gap-1.5 text-ui-caption text-muted-foreground sm:inline-flex">
                <Eye className="size-3.5" /> Read-only
              </span>
            </Tooltip>
          )}
          <Badge tone={p.active ? "positive" : "warning"}>
            {p.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-hairline p-5 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
        <Figure label="Stake">{formatLPT(p.stake)}</Figure>
        <Figure label="Rewards · 30 days">
          <span
            className={
              p.rewards30d > 0 ? "text-foreground" : "text-muted-foreground"
            }
          >
            {p.rewards30d > 0 ? "+" : ""}
            {formatLPT(p.rewards30d)}
          </span>
        </Figure>
        <Figure
          label="Unclaimed fees"
          action={
            canManage && p.fees > 0 ? (
              <button
                type="button"
                onClick={() =>
                  open({ kind: "withdrawFees", amount: p.fees, account })
                }
                className="cursor-pointer text-ui-caption text-green-bright underline-offset-4 hover:underline"
              >
                Withdraw
              </button>
            ) : undefined
          }
        >
          {p.fees > 0 ? formatETH(p.fees) : "—"}
        </Figure>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-ui-caption text-muted-foreground">
            Stake · 30 rounds
          </span>
          <Sparkline
            values={p.trend}
            color="var(--series-1)"
            width={140}
            height={28}
          />
        </div>
      </dl>

      {canManage && (
        <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-5 py-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => open({ kind: "delegate", to: p.delegate!, account })}
          >
            <Plus /> Delegate more
          </Button>
          <Link
            href="/orchestrators?move=1"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowRightLeft /> Switch
            <span className="-ml-1 hidden sm:inline">orchestrator</span>
          </Link>
          {p.stake > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() =>
                open({
                  kind: "undelegate",
                  account,
                  delegate: p.delegate!,
                  staked: p.stake,
                })
              }
            >
              <Minus /> Undelegate
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
