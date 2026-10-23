"use client";

import {
  ArrowRightLeft,
  Eye,
  Minus,
  MoreHorizontal,
  Plus,
  Send,
} from "lucide-react";
import Link from "next/link";

import { Avatar, useIdentity } from "@/components/identity";
import { Card } from "@/components/page";
import { useStaking } from "@/components/staking/staking";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Skeleton,
} from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { formatETH, formatLPT, formatNumber, formatUSD } from "@/lib/format";
import type { Orchestrator } from "@/lib/subgraph/network";

import { DUST_ETH, LPT_DUST, type Position } from "./positions";

/** The wallet-wide figures the rail lists beside its delegation. */
export type RailFigures = {
  rewards30: number;
  apr: number;
  /** Projected rewards over a year at today's rate. */
  year: number;
};

/** One labelled figure: the label left, the value (and a quieter note) right. */
function Row({
  label,
  children,
  note,
  action,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  note?: React.ReactNode;
  /** A small link on the value's line, e.g. Withdraw. */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ui-body text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-col items-end text-right tabular-nums">
        <span className="flex min-w-0 items-baseline gap-2">
          {action}
          <span className="truncate text-ui-body">{children}</span>
        </span>
        {note && (
          <span className="text-ui-caption text-subtle-foreground">{note}</span>
        )}
      </dd>
    </div>
  );
}

/** The orchestrator: avatar, name with its status beside it, terms below. */
function OrchestratorLine({
  address,
  terms,
  status,
}: {
  address: string;
  terms: string[];
  status: React.ReactNode;
}) {
  const { name, avatar, display } = useIdentity(address);
  return (
    <Link
      href={`/orchestrators/${address}`}
      className="group flex min-w-0 items-center gap-3 rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-green-bright/40"
    >
      <Avatar address={address} src={avatar} size={40} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span
            title={address}
            className={cn(
              "truncate text-[15px] font-medium text-foreground group-hover:underline",
              !name && "font-mono text-[14px]"
            )}
            style={{ textUnderlineOffset: 4 }}
          >
            {display}
          </span>
          <span className="shrink-0">{status}</span>
        </span>
        {terms.length > 0 && (
          <span className="truncate text-ui-caption text-muted-foreground">
            {terms.join(" · ")}
          </span>
        )}
      </span>
    </Link>
  );
}

/**
 * One wallet's position, brokerage-style, beside its balance history: who
 * it delegates to, what it holds and earns, and the two everyday actions.
 * Only what you'd act on; the rarer actions sit in its menu.
 */
export function PositionRail({
  loading,
  position: p,
  orchestrator: o,
  canManage,
  freeLpt,
  figures: f,
  ethPrice,
}: {
  loading: boolean;
  position: Position | undefined;
  orchestrator: Orchestrator | undefined;
  canManage: boolean;
  freeLpt: number | undefined;
  figures: RailFigures | undefined;
  ethPrice?: number;
}) {
  const { open } = useStaking();
  if (loading || !p || !f) {
    return <Skeleton className="h-[320px] w-full rounded-md" />;
  }

  const account = p.account.address;
  const delegate = p.delegate;
  // Any stake can be undelegated, even a leftover, to clear it out; moving
  // one isn't worth a transaction.
  const staked = p.stake > 0;
  const canMove = Boolean(delegate) && p.stake >= LPT_DUST;
  const leftover = p.stake > 0 && p.stake < LPT_DUST;
  const terms = o
    ? [
        `${formatNumber(o.rewardCut, { decimals: 0 })}% cut`,
        `${formatNumber(o.feeShare, { decimals: 0 })}% fee share`,
      ]
    : [];

  if (!delegate) {
    return (
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-ui-caption text-muted-foreground">
            Delegation
          </span>
          <span className="text-ui-body font-medium">Not delegated</span>
          <span className="text-ui-caption text-pretty text-muted-foreground">
            {canManage
              ? freeLpt != null
                ? `${formatLPT(
                    freeLpt
                  )} ready to delegate. Choose an orchestrator to start earning.`
                : "Choose an orchestrator to start earning rewards and fees."
              : "This account doesn't delegate to an orchestrator right now."}
          </span>
        </div>
        {canManage && (
          <Link
            href={`/orchestrators?account=${account}`}
            className={cn(buttonVariants({ variant: "primary" }), "w-full")}
          >
            Browse orchestrators
          </Link>
        )}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      {/* Who it's with: the label and the rarer actions on top, then the
          orchestrator with its status beside its name. */}
      <div className="flex flex-col gap-3 p-5">
        <div className="flex h-6 items-center justify-between gap-2">
          <span className="text-ui-caption text-muted-foreground">
            Delegated to
          </span>
          {canManage ? (
            <Menu>
              <MenuTrigger
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="More actions"
                    className="-mr-1.5"
                  />
                }
              >
                <MoreHorizontal />
              </MenuTrigger>
              <MenuContent align="end">
                <MenuItem
                  render={
                    <Link href={`/orchestrators?move=1&account=${account}`} />
                  }
                >
                  <ArrowRightLeft /> Switch orchestrator
                </MenuItem>
                {canMove && (
                  <MenuItem
                    onClick={() =>
                      open({
                        kind: "transfer",
                        account,
                        delegate,
                        staked: p.stake,
                      })
                    }
                  >
                    <Send /> Transfer stake
                  </MenuItem>
                )}
              </MenuContent>
            </Menu>
          ) : (
            <Tooltip content="Add this address to your portfolio to manage it here.">
              <span className="inline-flex size-6 items-center justify-center text-subtle-foreground">
                <Eye className="size-3.5" />
              </span>
            </Tooltip>
          )}
        </div>
        <OrchestratorLine
          address={delegate}
          terms={terms}
          status={
            <Badge tone={p.active ? "positive" : "warning"}>
              {p.active ? "Active" : "Inactive"}
            </Badge>
          }
        />
      </div>

      {/* What it holds and earns. Fees and unstaked LPT only when there are
          some. */}
      <dl className="flex flex-col gap-3.5 border-t border-hairline p-5">
        {/* The stake itself is the page's headline, beside this card; a
            leftover is named here so it isn't mistaken for a position. */}
        {leftover && (
          <Row
            label="Stake"
            note={
              <Tooltip
                content={
                  canManage
                    ? "A tiny leftover, too small to earn anything. Undelegate to clear it."
                    : "A tiny leftover, too small to earn anything."
                }
              >
                <span className="cursor-default underline decoration-dotted underline-offset-4">
                  Leftover
                </span>
              </Tooltip>
            }
          >
            {formatLPT(p.stake)}
          </Row>
        )}
        <Row
          label={
            <Tooltip content="Your realised yield over the last 30 rounds, compounded to a year. Not a promise: inflation, reward calls and cuts all move it.">
              <span className="cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-4">
                Realised APR
              </span>
            </Tooltip>
          }
          note={
            f.year >= 0.00005 ? `≈ +${formatLPT(f.year)} a year` : undefined
          }
        >
          {`${f.apr.toFixed(2)}%`}
        </Row>
        <Row label="Rewards · 30 days">
          <span
            className={
              f.rewards30 > 0 ? "text-green-bright" : "text-muted-foreground"
            }
          >
            {f.rewards30 > 0 ? "+" : ""}
            {formatLPT(f.rewards30)}
          </span>
        </Row>
        {p.fees >= DUST_ETH && (
          <Row
            label="Unclaimed fees"
            action={
              canManage && (
                <button
                  type="button"
                  onClick={() =>
                    open({ kind: "withdrawFees", amount: p.fees, account })
                  }
                  className="cursor-pointer text-ui-caption text-green-bright underline-offset-4 hover:underline"
                >
                  Withdraw
                </button>
              )
            }
            note={
              !canManage && ethPrice != null
                ? `≈ ${formatUSD(p.fees * ethPrice)}`
                : undefined
            }
          >
            {formatETH(p.fees)}
          </Row>
        )}
        {canManage && freeLpt != null && (
          <Row label="Unstaked">{formatLPT(freeLpt)}</Row>
        )}
      </dl>

      {/* The two everyday actions, side by side. */}
      {canManage && (
        <div className="flex gap-2 border-t border-hairline p-5">
          <Button
            size="sm"
            variant="primary"
            className="flex-1"
            onClick={() =>
              open({ kind: "delegate", to: delegate, account, amount: freeLpt })
            }
          >
            <Plus /> Delegate more
          </Button>
          {staked && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() =>
                open({
                  kind: "undelegate",
                  account,
                  delegate,
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
