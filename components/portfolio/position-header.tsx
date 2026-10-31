"use client";

import {
  ArrowLeftRight,
  ArrowRightLeft,
  ChevronRight,
  Minus,
  MoreHorizontal,
  Plus,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useBridge } from "@/components/bridge/context";
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
import { useL1Lpt } from "@/lib/bridge/withdrawals";
import { cn } from "@/lib/cn";

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
  const { bridge } = useBridge();
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
          <MenuItem onClick={() => bridge(account)}>
            <ArrowLeftRight /> Bridge LPT
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}

/** Without a delegation, the one other move: bridging LPT. */
function BridgeMenu({ account }: { account: string }) {
  const { bridge } = useBridge();
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button size="icon-sm" variant="ghost" aria-label="More actions" />
        }
      >
        <MoreHorizontal />
      </MenuTrigger>
      <MenuContent align="end">
        <MenuItem onClick={() => bridge(account)}>
          <ArrowLeftRight /> Bridge LPT
        </MenuItem>
      </MenuContent>
    </Menu>
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

/**
 * LPT a wallet holds on Ethereum, when it has nothing delegated and none
 * spare on Arbitrum: bringing it over is then the next step. 0 otherwise,
 * so delegators keeping LPT on Ethereum aren't nudged.
 */
function useOnlyOnEthereum(p: Position | undefined, freeLpt?: number) {
  const address = p?.account.address;
  const addresses = useMemo(() => (address ? [address] : []), [address]);
  const l1 = useL1Lpt(addresses);
  if (!p || p.delegate || (freeLpt ?? 0) >= LPT_DUST) return 0;
  const lpt = l1.get(p.account.address) ?? 0;
  return lpt >= 1 ? lpt : 0;
}

/** Beside the balance: the actions, or a way to start without a delegation. */
export function PositionActions({
  loading,
  position: p,
  canManage,
  freeLpt,
}: Props) {
  const { bridge } = useBridge();
  const onlyOnEthereum = useOnlyOnEthereum(p, freeLpt);
  if (!canManage) return null;
  if (loading || !p) return <Skeleton className="h-8 w-56 rounded-md" />;
  if (!p.delegate) {
    const account = p.account.address;
    return (
      <div className="flex items-center gap-2">
        {onlyOnEthereum > 0 && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => bridge(account, "toArbitrum")}
          >
            <ArrowLeftRight /> Bridge to Arbitrum
          </Button>
        )}
        <Link
          href={`/orchestrators?account=${account}`}
          className={cn(
            buttonVariants({
              variant: onlyOnEthereum > 0 ? "outline" : "primary",
              size: "sm",
            })
          )}
        >
          Browse orchestrators
        </Link>
        {onlyOnEthereum === 0 && <BridgeMenu account={account} />}
      </div>
    );
  }
  return (
    <DelegationActions position={p} delegate={p.delegate} freeLpt={freeLpt} />
  );
}

/**
 * Over the balance, in place of "Delegated stake": who it's delegated to, so the
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
      <div className="text-ui-caption text-muted-foreground">
        Delegated stake
      </div>
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
  const onlyOnEthereum = useOnlyOnEthereum(p, freeLpt);
  if (loading || !p || p.delegate) return null;
  // The action beside the balance is the bridge; this says why.
  if (canManage && onlyOnEthereum > 0) {
    return (
      <p className="text-ui-body text-muted-foreground">
        Not delegated. Your LPT is on Ethereum; bridge it to Arbitrum to
        delegate it.
      </p>
    );
  }
  return (
    <p className="text-ui-body text-muted-foreground">
      {canManage
        ? "Not delegated. Choose an orchestrator to start earning rewards and fees."
        : "Not delegated to an orchestrator right now."}
    </p>
  );
}
