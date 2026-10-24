"use client";

import {
  ArrowRightLeft,
  ChevronRight,
  Minus,
  MoreHorizontal,
  Plus,
  Send,
} from "lucide-react";
import Link from "next/link";

import { Avatar, useIdentity } from "@/components/identity";
import { useStaking } from "@/components/staking/staking";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Skeleton,
} from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { formatLPT } from "@/lib/format";

import { LPT_DUST, type Position } from "./positions";

/** Delegate and Undelegate, with the rarer moves in a menu beside them. */
function DelegationActions({
  position: p,
  delegate,
  freeLpt,
}: {
  position: Position;
  delegate: string;
  freeLpt: number | undefined;
}) {
  const { open } = useStaking();
  const account = p.account.address;
  // Any stake can be undelegated or transferred, even a leftover, to clear
  // it out.
  const staked = p.stake > 0;
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="primary"
        className="flex-1 sm:flex-none"
        onClick={() =>
          open({ kind: "delegate", to: delegate, account, amount: freeLpt })
        }
      >
        <Plus /> Delegate
      </Button>
      {staked && (
        <Button
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={() =>
            open({ kind: "undelegate", account, delegate, staked: p.stake })
          }
        >
          <Minus /> Undelegate
        </Button>
      )}
      <Menu>
        <MenuTrigger
          render={
            <Button size="icon-sm" variant="ghost" aria-label="More actions" />
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
          {staked && (
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
    </div>
  );
}

type Props = {
  loading: boolean;
  position: Position | undefined;
  canManage: boolean;
  freeLpt: number | undefined;
};

/**
 * A wallet delegates to one orchestrator, so its balance is its position. On
 * a single wallet's page the balance headline carries the delegation: the
 * label over the number names the orchestrator, the actions sit beside it,
 * and without one a note under it says how to start.
 */

/** Beside the balance: the actions, or a way to start without a delegation. */
export function PositionActions({
  loading,
  position: p,
  canManage,
  freeLpt,
}: Props) {
  if (!canManage) return null;
  if (loading || !p) return <Skeleton className="h-8 w-56 rounded-md" />;
  if (!p.delegate) {
    return (
      <Link
        href={`/orchestrators?account=${p.account.address}`}
        className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
      >
        Browse orchestrators
      </Link>
    );
  }
  return (
    <DelegationActions position={p} delegate={p.delegate} freeLpt={freeLpt} />
  );
}

/**
 * Over the balance, in place of "Total stake": who it's delegated to, so the
 * number and the actions beside it plainly belong to that orchestrator.
 * Opens its page.
 */
export function PositionLabel({
  loading,
  position: p,
}: Pick<Props, "loading" | "position">) {
  const { name, avatar, display } = useIdentity(p?.delegate ?? null);
  if (loading || !p?.delegate) {
    return (
      <div className="text-ui-caption text-muted-foreground">Total stake</div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-1 text-ui-body text-muted-foreground">
      <span className="shrink-0">Delegated to</span>
      <Link
        href={`/orchestrators/${p.delegate}`}
        title={p.delegate}
        className="group -my-1 flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-foreground outline-none transition-colors hover:bg-hover focus-visible:ring-1 focus-visible:ring-green-bright/40"
      >
        <Avatar
          address={p.delegate}
          src={avatar}
          size={20}
          className="shrink-0 ring-1 ring-foreground/10"
        />
        <span
          className={cn(
            "truncate font-medium",
            !name && "font-mono text-[13px]"
          )}
        >
          {display}
        </span>
        <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
      {!p.active && <span className="shrink-0 text-warm">Inactive</span>}
    </div>
  );
}

/**
 * Under the balance, only without a delegation: says so, and how to start.
 * With one, the label above already says where the stake is, and what it's
 * earned is beside the balance.
 */
export function PositionNote({
  loading,
  position: p,
  canManage,
  freeLpt,
}: Props) {
  if (loading || !p || p.delegate) return null;
  return (
    <p className="text-ui-body text-muted-foreground">
      {canManage
        ? freeLpt != null && freeLpt >= LPT_DUST
          ? `Not delegated. ${formatLPT(
              freeLpt
            )} ready to delegate: choose an orchestrator to start earning.`
          : "Not delegated. Choose an orchestrator to start earning rewards and fees."
        : "Not delegated to an orchestrator right now."}
    </p>
  );
}
