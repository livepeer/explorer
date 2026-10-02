"use client";

import {
  ArrowRightLeft,
  Eye,
  Minus,
  MoreHorizontal,
  Plus,
  Send,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

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
import {
  type PortfolioAccount,
  usePortfolioAccounts,
} from "@/lib/hooks/watchlist";
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

function AccountCell({
  account,
  quiet = false,
}: {
  account: PortfolioAccount;
  /** Leave out "Not connected": cards don't need it to line up, as rows do. */
  quiet?: boolean;
}) {
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
        {(account.connected || account.label || name || !quiet) && (
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
        )}
      </span>
    </Link>
  );
}

/** "152,374 LPT" with the unit quiet, so the number is what's read. */
function Amount({ value }: { value: string }) {
  const i = value.lastIndexOf(" ");
  if (i < 0) return <>{value}</>;
  return (
    <>
      {value.slice(0, i)}
      <span className="text-muted-foreground">{value.slice(i)}</span>
    </>
  );
}

/** A card's supporting line: who the wallet delegates to, and on what terms. */
function DelegatedTo({
  address,
  active,
  orchestrator: o,
}: {
  address: string;
  active: boolean;
  orchestrator: Orchestrator | undefined;
}) {
  const { name, avatar } = useIdentity(address);
  // Each item carries its separator in its left padding, and the row is
  // pulled left by that much inside a clipping box: a separator at the start
  // of a wrapped line falls outside it, so no line begins with a dot.
  return (
    <div className="overflow-hidden text-ui-caption text-muted-foreground">
      <div className="-ml-3.5 flex flex-wrap items-center gap-y-1">
        <span className="flex min-w-0 items-center gap-1.5 pl-3.5">
          <span className="shrink-0">Delegated to</span>
          <Link
            href={`/orchestrators/${address}`}
            className="inline-flex min-w-0 items-center gap-1.5 rounded-sm text-foreground outline-none hover:opacity-80"
          >
            <Avatar address={address} src={avatar} size={16} />
            <span className="truncate">
              {name ?? (
                <span className="font-mono text-[12px]">
                  {shortAddress(address)}
                </span>
              )}
            </span>
          </Link>
          {!active && <Badge tone="warning">Inactive</Badge>}
        </span>
        {o && (
          <span className="relative pl-3.5 whitespace-nowrap text-subtle-foreground before:absolute before:left-[5px] before:content-['·']">
            {formatNumber(o.rewardCut, { decimals: 0 })}% cut ·{" "}
            {formatNumber(o.feeShare, { decimals: 0 })}% fee share
          </span>
        )}
      </div>
    </div>
  );
}

/** Stake can be transferred when there's stake and another wallet to take it. */
function useCanMove(p: Position) {
  const { accounts } = usePortfolioAccounts();
  return (
    Boolean(p.delegate) &&
    p.stake > 0 &&
    accounts.some((a) => a.address !== p.account.address)
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
  const canMove = useCanMove(position);
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
        {canMove && (
          <MenuItem
            onClick={() =>
              open({
                kind: "transfer",
                account: position.account.address,
                delegate: position.delegate!,
                staked: position.stake,
              })
            }
          >
            <Send /> Transfer stake
          </MenuItem>
        )}
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
      {/* Narrow: one card per position. The wallet, a quiet line for who
          it delegates to, then its figures as one strip. */}
      <Card className="divide-y divide-(--hairline) @min-[44rem]:hidden">
        {positions.map((p) => {
          const o = p.delegate ? orchestrators.get(p.delegate) : undefined;
          return (
            <div key={p.account.address} className="flex flex-col gap-3 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  {showAccount ? (
                    <AccountCell account={p.account} quiet />
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
                  <DelegatedTo
                    address={p.delegate}
                    active={p.active}
                    orchestrator={o}
                  />
                )}
              </div>
              {/* Fixed columns, so they line up from card to card, weighted
                  to what each holds: equal thirds cut a fee like
                  "0.000596 ETH" off on a phone. */}
              <dl className="grid grid-cols-[1fr_1fr_1.1fr] gap-2 rounded-md bg-hover/60 px-2.5 py-2.5">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <dt className="text-[11px] text-muted-foreground">Stake</dt>
                  <dd className="truncate font-mono text-[12.5px] tabular-nums">
                    <Amount value={formatLPT(p.stake)} />
                  </dd>
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <dt className="text-[11px] text-muted-foreground">
                    30d rewards
                  </dt>
                  <dd
                    className={cn(
                      "truncate font-mono text-[12.5px] tabular-nums",
                      p.rewards30d > 0 && "text-green-bright"
                    )}
                  >
                    {p.rewards30d > 0 ? "+" : ""}
                    {formatLPT(p.rewards30d)}
                  </dd>
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <dt className="text-[11px] text-muted-foreground">Fees</dt>
                  <dd className="truncate font-mono text-[12.5px] tabular-nums">
                    {p.fees > 0 ? (
                      <Amount value={formatETH(p.fees)} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
              </dl>
              {!showAccount && o && (
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
            {/* Each term stays whole, so a wrap never strands a dot. */}
            {terms.map((t, i) => (
              <Fragment key={t}>
                {i > 0 && " "}
                <span className="whitespace-nowrap">
                  {i > 0 && "· "}
                  {t}
                </span>
              </Fragment>
            ))}
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
  const canMove = useCanMove(p);

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
        <div className="@container border-t border-hairline">
          <div className="flex items-center gap-2 px-4 py-3 @min-[44rem]:px-5">
            <Button
              size="sm"
              variant="primary"
              className="flex-1 @min-[44rem]:flex-none"
              onClick={() =>
                open({ kind: "delegate", to: p.delegate!, account })
              }
            >
              <Plus /> Delegate more
            </Button>
            <Link
              href="/orchestrators?move=1"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ArrowRightLeft /> Switch
              <span className="-ml-1 hidden @min-[44rem]:inline">
                orchestrator
              </span>
            </Link>
            {/* A wide card shows the rarer actions; a narrow one, on a phone or
              beside the side panels, folds them into a menu so the footer
              stays one row. */}
            <div className="ml-auto hidden items-center gap-1 @min-[44rem]:flex">
              {canMove && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    open({
                      kind: "transfer",
                      account,
                      delegate: p.delegate!,
                      staked: p.stake,
                    })
                  }
                >
                  <Send /> Transfer stake
                </Button>
              )}
              {p.stake > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
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
            {(canMove || p.stake > 0) && (
              <Menu>
                <MenuTrigger
                  render={
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="More actions"
                      className="ml-auto @min-[44rem]:hidden"
                    />
                  }
                >
                  <MoreHorizontal />
                </MenuTrigger>
                <MenuContent>
                  {canMove && (
                    <MenuItem
                      onClick={() =>
                        open({
                          kind: "transfer",
                          account,
                          delegate: p.delegate!,
                          staked: p.stake,
                        })
                      }
                    >
                      <Send /> Transfer stake
                    </MenuItem>
                  )}
                  {p.stake > 0 && (
                    <MenuItem
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
                    </MenuItem>
                  )}
                </MenuContent>
              </Menu>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
