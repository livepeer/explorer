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
  /** Realised rewards, compounded to a year (%). */
  apr: number;
  /** Fees as a simple annual % of stake, or null without prices. */
  feeApr: number | null;
  /** How the APR splits, for its tooltip. */
  aprSplit: React.ReactNode;
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
  /** A small button on the line beneath the value, after its note, e.g.
   *  Withdraw; the values above stay aligned. */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ui-body text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-col items-end text-right tabular-nums">
        <span className="truncate text-ui-body">{children}</span>
        {(note || action) && (
          <span className="mt-1 flex items-center gap-2 text-ui-caption text-subtle-foreground">
            {note}
            {action}
          </span>
        )}
      </dd>
    </div>
  );
}

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
    <Card className="flex flex-col gap-6 p-5">
      {/* Who it's with, and the rarer actions. */}
      <div className="flex items-start justify-between gap-3">
        <OrchestratorLine address={delegate} terms={terms} active={p.active} />
        {menu}
      </div>

      {/* The headline: what the delegation yields, and where it's heading.
          (Its history is the chart beside this card.) */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Tooltip content={f.aprSplit}>
            <span className="w-fit cursor-help text-ui-caption text-muted-foreground underline decoration-dotted decoration-foreground/30 underline-offset-4">
              Realised APR
            </span>
          </Tooltip>
          <span className="text-[28px] leading-8 font-medium tracking-[-0.02em] tabular-nums">
            {(f.apr + (f.feeApr ?? 0)).toFixed(2)}
            <span className="text-[18px] text-muted-foreground">%</span>
          </span>
          {f.year >= 0.00005 && (
            <span className="text-ui-caption text-muted-foreground tabular-nums">
              ≈ +{formatLPT(f.year)} a year
            </span>
          )}
        </div>
      </div>

      {/* The supporting figures; fees, unstaked LPT and a leftover stake
          only when there are some. */}
      <dl className="flex flex-col gap-3 border-t border-hairline pt-5">
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
            // An action, styled as one (green here means a gain), after the
            // amount; its dollar value beneath helps judge whether it's
            // worth a withdrawal's gas yet.
            action={
              canManage && (
                <Button
                  size="xs"
                  onClick={() =>
                    open({ kind: "withdrawFees", amount: p.fees, account })
                  }
                >
                  Withdraw
                </Button>
              )
            }
            note={
              ethPrice != null ? `≈ ${formatUSD(p.fees * ethPrice)}` : undefined
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
        <div className="flex gap-2">
          <Button
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
