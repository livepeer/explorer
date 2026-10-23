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
import { formatLPT, formatNumber, formatToken } from "@/lib/format";
import type { Orchestrator } from "@/lib/subgraph/network";

import { LPT_DUST, type Position } from "./positions";

/** The wallet-wide figures the rail lists beside its delegation. */
export type RailFigures = {
  /** Realised rewards, compounded to a year (%). */
  apr: number;
  /** Fees as a simple annual % of stake, or null without prices. */
  feeApr: number | null;
  /** How the APR splits, for its tooltip. */
  aprSplit: React.ReactNode;
  /** Projected rewards over a year at today's rate. */
  year: number;
};

/**
 * Who it's with: the avatar carrying its status as a dot (green, active;
 * amber, inactive), a caption, the name, and its terms. Inactive is also
 * said in words, since it costs you rewards.
 */
function OrchestratorLine({
  address,
  terms,
  active,
}: {
  address: string;
  terms: string[];
  active: boolean;
}) {
  const { name, avatar, display } = useIdentity(address);
  return (
    <Link
      href={`/orchestrators/${address}`}
      className="group flex min-w-0 items-center gap-3 rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-green-bright/40"
    >
      <Tooltip content={active ? "Active this round" : "Not in the active set"}>
        <span className="relative shrink-0">
          <Avatar address={address} src={avatar} size={40} />
          <span
            className={cn(
              "absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface",
              active ? "bg-green-fill" : "bg-warm"
            )}
          />
        </span>
      </Tooltip>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-ui-caption text-muted-foreground">
          Delegated to
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <span
            title={address}
            className={cn(
              "truncate text-[15px] leading-6 font-medium text-foreground group-hover:underline",
              !name && "font-mono text-[14px]"
            )}
            style={{ textUnderlineOffset: 4 }}
          >
            {display}
          </span>
          {!active && (
            <Badge tone="warning" className="shrink-0">
              Inactive
            </Badge>
          )}
        </span>
        {terms.length > 0 && (
          <span className="truncate text-ui-caption text-subtle-foreground">
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
}: {
  loading: boolean;
  position: Position | undefined;
  orchestrator: Orchestrator | undefined;
  canManage: boolean;
  freeLpt: number | undefined;
  figures: RailFigures | undefined;
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

  const menu = canManage ? (
    <Menu>
      <MenuTrigger
        render={
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="More actions"
            className="-mt-1 -mr-1.5"
          />
        }
      >
        <MoreHorizontal />
      </MenuTrigger>
      <MenuContent align="end">
        <MenuItem
          render={<Link href={`/orchestrators?move=1&account=${account}`} />}
        >
          <ArrowRightLeft /> Switch orchestrator
        </MenuItem>
        {canMove && (
          <MenuItem
            onClick={() =>
              open({ kind: "transfer", account, delegate, staked: p.stake })
            }
          >
            <Send /> Transfer stake
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  ) : (
    <Tooltip content="Add this address to your portfolio to manage it here.">
      <span className="-mt-1 inline-flex size-6 items-center justify-center text-subtle-foreground">
        <Eye className="size-3.5" />
      </span>
    </Tooltip>
  );

  return (
    <Card className="flex flex-col gap-5 p-5">
      {/* Who it's with, and the rarer actions. */}
      <div className="flex items-start justify-between gap-3">
        <OrchestratorLine address={delegate} terms={terms} active={p.active} />
        {menu}
      </div>

      {/* Two matching figures over two matching buttons: what it yields,
          and what that comes to a year. */}
      <dl className="grid grid-cols-2 divide-x divide-(--hairline) border-y border-hairline py-4">
        <div className="flex min-w-0 flex-col gap-1 pr-4">
          <dt className="flex h-4 items-center">
            <Tooltip content={f.aprSplit}>
              <span className="cursor-help text-ui-caption text-muted-foreground underline decoration-dotted decoration-foreground/30 underline-offset-4">
                Realised APR
              </span>
            </Tooltip>
          </dt>
          <dd className="truncate text-[22px] leading-7 font-medium tracking-[-0.01em] tabular-nums">
            {(f.apr + (f.feeApr ?? 0)).toFixed(2)}
            <span className="text-[15px] text-muted-foreground">%</span>
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-1 pl-4">
          <dt className="flex h-4 items-center text-ui-caption text-muted-foreground">
            Per year
          </dt>
          <dd className="truncate text-[22px] leading-7 font-medium tracking-[-0.01em] tabular-nums">
            {f.year >= 0.00005 ? (
              <>
                +{formatToken(f.year, { compact: true })}
                <span className="text-[15px] text-muted-foreground"> LPT</span>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </dd>
        </div>
      </dl>

      {/* Only when there's some: LPT ready to delegate, or a leftover stake
          to clear. (Fees are collected under Withdrawals, beside it.) */}
      {((canManage && freeLpt != null) || leftover) && (
        <ul className="flex flex-col gap-2 text-ui-caption text-muted-foreground">
          {canManage && freeLpt != null && (
            <li className="flex h-6 items-center justify-between gap-3">
              <span className="truncate">Unstaked</span>
              <span className="text-foreground tabular-nums">
                {formatLPT(freeLpt)}
              </span>
            </li>
          )}
          {leftover && (
            <li>
              Only a leftover ({formatLPT(p.stake)}) is staked here.
              {canManage && " Undelegate to clear it."}
            </li>
          )}
        </ul>
      )}

      {/* The two everyday actions, equal halves. */}
      {canManage && (
        <div
          className={cn("grid gap-2", staked ? "grid-cols-2" : "grid-cols-1")}
        >
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              open({ kind: "delegate", to: delegate, account, amount: freeLpt })
            }
          >
            <Plus /> Delegate
          </Button>
          {staked && (
            <Button
              size="sm"
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
