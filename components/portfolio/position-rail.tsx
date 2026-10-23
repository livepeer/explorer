"use client";

import {
  ArrowRightLeft,
  ChevronRight,
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
import { formatLPT, formatNumber } from "@/lib/format";
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
 * Who it's with, as one row that opens its page: the avatar, the name, its
 * terms beneath (led by "Inactive" in amber when it's out of the active
 * set), and a chevron.
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
      className="group -mx-2 flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5 outline-none transition-colors hover:bg-hover focus-visible:ring-1 focus-visible:ring-green-bright/40"
    >
      <Avatar
        address={address}
        src={avatar}
        size={32}
        className="shrink-0 ring-1 ring-foreground/10"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          title={address}
          className={cn(
            "truncate text-ui-body font-medium text-foreground",
            !name && "font-mono text-[13px]"
          )}
        >
          {display}
        </span>
        <span className="truncate text-ui-caption text-muted-foreground">
          {!active && <span className="text-warm">Inactive · </span>}
          {terms.join(" · ")}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** One figure in the card: its label left, its value right. */
function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ui-body text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-ui-body tabular-nums">
        {children}
      </dd>
    </div>
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
            className="-mr-1.5"
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
      <span className="inline-flex size-6 items-center justify-center text-subtle-foreground">
        <Eye className="size-3.5" />
      </span>
    </Tooltip>
  );

  // A leftover stake, too small to show at four places, is named.
  const leftover = p.stake > 0 && p.stake < LPT_DUST;

  return (
    <Card className="flex flex-col">
      {/* Titled like a broker's position panel; its menu (switch,
          transfer) beside the title. */}
      <div className="flex flex-col gap-2 px-5 pt-4 pb-3">
        <div className="flex h-7 items-center justify-between">
          <span className="text-ui-caption text-muted-foreground">
            Your delegation
          </span>
          {menu}
        </div>
        <OrchestratorLine address={delegate} terms={terms} active={p.active} />
      </div>

      {/* The position, one figure a row. */}
      <dl className="flex flex-col gap-2.5 border-t border-hairline px-5 py-4">
        {/* What's delegated, first: a position panel states its size (a
            leftover is named so it isn't mistaken for a position). */}
        <Row label="Staked">
          {formatLPT(p.stake)}
          {leftover && (
            <Tooltip
              content={
                canManage
                  ? "A tiny leftover, too small to earn anything. Undelegate to clear it."
                  : "A tiny leftover, too small to earn anything."
              }
            >
              <span className="ml-1.5 cursor-default text-ui-caption text-muted-foreground underline decoration-dotted underline-offset-4">
                leftover
              </span>
            </Tooltip>
          )}
        </Row>
        <Row
          label={
            <Tooltip content={f.aprSplit}>
              <span className="cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-4">
                Realised APR
              </span>
            </Tooltip>
          }
        >
          {(f.apr + (f.feeApr ?? 0)).toFixed(2)}%
        </Row>
        <Row label="Per year">
          {f.year >= 0.00005 ? (
            <span className="text-green-bright">+{formatLPT(f.year)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Row>
        {canManage && freeLpt != null && (
          <Row label="Available">{formatLPT(freeLpt)}</Row>
        )}
      </dl>

      {/* The two everyday actions, equal halves. */}
      {canManage && (
        <div
          className={cn(
            "grid gap-2 border-t border-hairline px-5 py-4",
            staked ? "grid-cols-2" : "grid-cols-1"
          )}
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
