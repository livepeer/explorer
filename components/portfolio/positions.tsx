"use client";

import {
  ArrowRightLeft,
  Eye,
  Minus,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { toast } from "sonner";
import { useDisconnect } from "wagmi";

import { Sparkline } from "@/components/charts/time-series";
import {
  Avatar,
  CopyButton,
  Identity,
  useIdentity,
} from "@/components/identity";
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
import { useViewScope } from "@/lib/hooks/view-scope";
import { type PortfolioAccount, useAddresses } from "@/lib/hooks/watchlist";
import type { Orchestrator } from "@/lib/subgraph/network";

export type Position = {
  account: PortfolioAccount;
  delegate: string | null;
  stake: number;
  fees: number;
  rewards30d: number;
  /** Rewards over 30 days as a delegator, without reward-cut commission. */
  delegatorRewards30d: number;
  trend: number[];
  active: boolean;
};

function AccountCell({
  account,
  quiet = false,
  copy = false,
}: {
  account: PortfolioAccount;
  /** Leave out "Not connected": cards don't need it to line up, as rows do. */
  quiet?: boolean;
  /** A copy button, revealed on hover. */
  copy?: boolean;
}) {
  const { name, avatar } = useIdentity(account.address);
  return (
    <span className="group/copy flex min-w-0 items-center gap-1">
      <Link
        href={`/accounts/${account.address}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-sm outline-none hover:opacity-80"
      >
        <Avatar address={account.address} src={avatar} size={26} />
        <span className="flex min-w-0 flex-col">
          {/* A block, not a flex row: only a block truncates with "…". */}
          <span className="truncate text-ui-body">
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
                <span className="font-mono">
                  {shortAddress(account.address)}
                </span>
              ) : (
                "Not connected"
              )}
            </span>
          )}
        </span>
      </Link>
      {copy && <CopyButton value={account.address} reveal />}
    </span>
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

/**
 * Stake can be transferred whenever there's stake: to another of the
 * portfolio's wallets, or to any address typed into the picker.
 */
function useCanMove(p: Position) {
  return Boolean(p.delegate) && p.stake > 0;
}

/** Fees below this show as 0.000000 ETH: not worth a withdrawal's gas. */
export const DUST_ETH = 0.0000005;

function RowActions({
  position,
  canManage,
}: {
  position: Position;
  canManage: boolean;
}) {
  const { open } = useStaking();
  const canMove = useCanMove(position);
  const { list, add, remove } = useAddresses();
  const { disconnect } = useDisconnect();
  const [scope, setScope] = useViewScope(list.map((w) => w.address));
  const account = position.account;
  const saved = list.some((w) => w.address === account.address);

  // As in the sidebar's switcher: forgetting is undoable, so no confirm. A
  // connected wallet would be added straight back, so it's disconnected too.
  const removeAccount = () => {
    if (account.connected) disconnect();
    remove(account.address);
    if (scope === account.address) setScope("all");
    toast(`Removed ${account.label ?? shortAddress(account.address)}`, {
      action: {
        label: "Undo",
        onClick: () => add(account.address, account.label),
      },
    });
  };
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
        <MenuItem
          render={
            <Link
              href={`/orchestrators?move=1&account=${position.account.address}`}
            />
          }
        >
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
        {position.fees >= DUST_ETH && (
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
        {saved && (
          <>
            <MenuSeparator />
            <MenuItem
              className="text-destructive [&_svg]:text-destructive"
              onClick={removeAccount}
            >
              <Trash2 />
              {account.connected
                ? "Disconnect and remove"
                : "Remove from portfolio"}
            </MenuItem>
          </>
        )}
      </MenuContent>
    </Menu>
  );
}

/**
 * Name cells' widest: long names and terms truncate rather than widen the
 * table past its card, which would scroll the actions out of view. The
 * account cell keeps room for a shortened address and its copy button.
 */
const ACCOUNT_CELL =
  "max-w-[11rem] @min-[60rem]:max-w-[13rem] @min-[66rem]:max-w-[16rem]";
const ORCHESTRATOR_CELL =
  "max-w-[9.5rem] @min-[60rem]:max-w-[13rem] @min-[66rem]:max-w-[16rem]";

/**
 * One wallet in the phone list, in two lines: the wallet and its stake, then
 * who it delegates to and its 30-day rewards. Without the account column
 * (one wallet's view), the orchestrator leads instead.
 */
function PositionListRow({
  position: p,
  showAccount,
  canManage,
}: {
  position: Position;
  showAccount: boolean;
  canManage: boolean;
}) {
  const account = useIdentity(p.account.address);
  const delegate = useIdentity(p.delegate ?? undefined);
  const lead = showAccount
    ? {
        address: p.account.address,
        href: `/accounts/${p.account.address}`,
        name: p.account.label ?? account.name,
        avatar: account.avatar,
      }
    : p.delegate
    ? {
        address: p.delegate,
        href: `/orchestrators/${p.delegate}`,
        name: delegate.name,
        avatar: delegate.avatar,
      }
    : null;
  return (
    <div className="flex items-center gap-3 py-3 pr-2 pl-4">
      {lead && (
        <Link
          href={lead.href}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-sm outline-none hover:opacity-80"
        >
          <Avatar address={lead.address} src={lead.avatar} size={30} />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-ui-body">
              {lead.name ?? (
                <span className="font-mono text-[13px]">
                  {shortAddress(lead.address)}
                </span>
              )}
            </span>
            {showAccount && (
              <span className="flex min-w-0 items-center gap-1.5 text-ui-caption text-muted-foreground">
                <span className="truncate">
                  {p.delegate ? (
                    <>
                      to{" "}
                      {delegate.name ?? (
                        <span className="font-mono text-[12px]">
                          {shortAddress(p.delegate)}
                        </span>
                      )}
                    </>
                  ) : (
                    "Not delegated"
                  )}
                </span>
                {p.delegate && !p.active && (
                  <Badge tone="warning">Inactive</Badge>
                )}
              </span>
            )}
          </span>
        </Link>
      )}
      <span className="flex shrink-0 flex-col items-end gap-0.5 text-right tabular-nums">
        <span className="text-ui-body font-medium whitespace-nowrap">
          <Amount value={formatLPT(p.stake)} />
        </span>
        <span className="text-ui-caption whitespace-nowrap text-muted-foreground">
          {p.rewards30d > 0 ? (
            <span className="text-green-bright">
              +{formatLPT(p.rewards30d)}
            </span>
          ) : (
            "No rewards"
          )}{" "}
          · 30d
        </span>
        {p.fees >= DUST_ETH && (
          <span className="text-ui-caption whitespace-nowrap text-muted-foreground">
            <span className="text-foreground">{formatETH(p.fees)}</span> fees
          </span>
        )}
      </span>
      <RowActions position={p} canManage={canManage} />
    </div>
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
      {/* Phones: a compact list with what matters at a glance. The wallet
          and who it delegates to; its stake, 30-day rewards and unclaimed
          fees. Terms are a tap away on the orchestrator page, and a raised
          cut or inactive orchestrator shows in Needs attention; "Inactive"
          stays on the row. */}
      <Card className="divide-y divide-(--hairline) @min-[40rem]:hidden">
        {positions.map((p) => (
          <PositionListRow
            key={p.account.address}
            position={p}
            showAccount={showAccount}
            canManage={canManage(p.account.address)}
          />
        ))}
      </Card>

      {/* Wider: a table, adding columns as they fit, actions always in view:
          30-day rewards from 48rem, the trend from 60rem. Below 48rem cells pad
          less and names truncate sooner, so the actions stay in view. */}
      <Card className="hidden overflow-x-auto @min-[40rem]:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-hairline text-ui-caption whitespace-nowrap text-muted-foreground">
              {showAccount && (
                <th className="px-2.5 @min-[48rem]:px-3 py-2.5 font-normal">
                  Account
                </th>
              )}
              <th className="px-2.5 @min-[48rem]:px-3 py-2.5 font-normal">
                Orchestrator
              </th>
              <th className="px-2.5 @min-[48rem]:px-3 py-2.5 text-right font-normal">
                Stake
              </th>
              <th className="hidden px-2.5 @min-[48rem]:px-3 py-2.5 text-right font-normal @min-[48rem]:table-cell">
                30d rewards
              </th>
              <th className="px-2.5 @min-[48rem]:px-3 py-2.5 text-right font-normal">
                Unclaimed fees
              </th>
              <th className="hidden px-2.5 @min-[48rem]:px-3 py-2.5 font-normal @min-[60rem]:table-cell">
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
                    <td className="px-2.5 @min-[48rem]:px-3 py-3">
                      <div className={ACCOUNT_CELL}>
                        <AccountCell account={p.account} copy />
                      </div>
                    </td>
                  )}
                  <td className="px-2.5 @min-[48rem]:px-3 py-3">
                    {p.delegate ? (
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          ORCHESTRATOR_CELL
                        )}
                      >
                        <Identity
                          address={p.delegate}
                          href={`/orchestrators/${p.delegate}`}
                          size={22}
                          copy
                          secondary={
                            o
                              ? `${formatNumber(o.rewardCut, {
                                  decimals: 0,
                                })}% cut · ${formatNumber(o.feeShare, {
                                  decimals: 0,
                                })}% fee share`
                              : undefined
                          }
                          badge={
                            !p.active && <Badge tone="warning">Inactive</Badge>
                          }
                        />
                      </div>
                    ) : (
                      <span className="text-ui-body text-muted-foreground">
                        Not delegated
                      </span>
                    )}
                  </td>
                  <td className="px-2.5 @min-[48rem]:px-3 py-3 text-right">
                    <div className="text-ui-body whitespace-nowrap tabular-nums">
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
                  <td className="hidden px-2.5 @min-[48rem]:px-3 py-3 text-right text-ui-body whitespace-nowrap tabular-nums @min-[48rem]:table-cell">
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
                  <td className="px-2.5 @min-[48rem]:px-3 py-3 text-right text-ui-body whitespace-nowrap text-muted-foreground tabular-nums">
                    {p.fees >= DUST_ETH ? (
                      <span className="text-foreground">
                        {formatETH(p.fees)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="hidden px-2.5 @min-[48rem]:px-3 py-3 @min-[60rem]:table-cell">
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
                href={`/orchestrators?account=${account}`}
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
            canManage && p.fees >= DUST_ETH ? (
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
          {p.fees >= DUST_ETH ? formatETH(p.fees) : "—"}
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
              href={`/orchestrators?move=1&account=${account}`}
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
