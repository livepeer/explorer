"use client";

import {
  ArrowLeftRight,
  ArrowRight,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Minus,
  MoreHorizontal,
  Plus,
  Send,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo } from "react";
import { useReadContract } from "wagmi";

import { useBridge } from "@/components/bridge/context";
import { Avatar, useIdentity } from "@/components/identity";
import { useStaking } from "@/components/staking/staking";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Skeleton,
} from "@/components/ui/misc";
import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { useL1Lpt } from "@/lib/bridge/withdrawals";
import { cn } from "@/lib/cn";
import { L2_CHAIN } from "@/lib/config";
import { formatToken, fromWei } from "@/lib/format";
import { useProtocolContract } from "@/lib/staking/contracts";

import type { Position } from "./positions";

/** Below this, a balance is dust left over, not LPT to do something with. */
const SHOWN_LPT = 0.01;

/** LPT the wallet holds, not delegated, on each network; 0 under SHOWN_LPT. */
function useHeld(account: string | undefined) {
  const token = useProtocolContract("LivepeerToken");
  const { data: l2Wei } = useReadContract({
    address: token,
    abi: livepeerToken,
    functionName: "balanceOf",
    args: [account as `0x${string}`],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(token && account), staleTime: 60_000 },
  });
  const addresses = useMemo(() => (account ? [account] : []), [account]);
  const l1 = useL1Lpt(addresses);
  const arbitrum = l2Wei != null ? fromWei(l2Wei as bigint) : 0;
  const ethereum = account ? l1.get(account) ?? 0 : 0;
  return {
    arbitrum: arbitrum >= SHOWN_LPT ? arbitrum : 0,
    ethereum: ethereum >= SHOWN_LPT ? ethereum : 0,
  };
}

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

/** Over the balance: who it's delegated to, opening its page. */
function DelegatedTo({ position: p }: { position: Position }) {
  const { name, avatar, display } = useIdentity(p.delegate);
  // An orchestrator's own stake: its name is already the page's.
  if (p.delegate?.toLowerCase() === p.account.address.toLowerCase()) {
    return (
      <div className="flex min-w-0 items-center gap-1 text-ui-body text-muted-foreground">
        <span className="shrink-0">Self-delegated</span>
        <span aria-hidden className="text-subtle-foreground">
          ·
        </span>
        <Link
          href={`/orchestrators/${p.delegate}`}
          className="group -my-1 flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-foreground outline-none transition-colors hover:bg-hover focus-visible:ring-1 focus-visible:ring-green-bright/40"
        >
          Orchestrator page
          <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        {!p.active && <span className="shrink-0 text-warm">Inactive</span>}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-1 text-ui-body text-muted-foreground">
      <span className="shrink-0">Delegated to</span>
      <Link
        href={`/orchestrators/${p.delegate}`}
        title={p.delegate ?? undefined}
        className="group -my-1 flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-foreground outline-none transition-colors hover:bg-hover focus-visible:ring-1 focus-visible:ring-green-bright/40"
      >
        <Avatar
          address={p.delegate!}
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

type Balance = {
  key: "arbitrum" | "ethereum";
  network: string;
  lpt: number;
  actions: {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
  }[];
};

/**
 * The LPT a wallet holds but hasn't delegated, as a quiet chip under the
 * headline. It opens a menu with each balance and what it can do: on
 * Arbitrum delegate it or bridge it to Ethereum (to sell, say), on Ethereum
 * bridge it over. For an account you can't act for, the balances alone.
 */
function BalanceChip({
  balances,
  total,
}: {
  balances: Balance[];
  /** Label it with the total, when the headline is something else. */
  total?: boolean;
}) {
  // A few words, the split in the menu: under a stake, the total ("65.00 LPT
  // in wallet"); under the headline's own total, "By network".
  const label = total ? (
    <span>
      <span className="text-foreground tabular-nums">
        {formatToken(balances.reduce((sum, b) => sum + b.lpt, 0))} LPT
      </span>{" "}
      in wallet
    </span>
  ) : (
    <span>By network</span>
  );
  // Nothing to do, only where it is: a short list, no groups.
  const readOnly = !balances.some((b) => b.actions.length);
  // Nothing to do and one place it can be: no menu, the label says where.
  if (readOnly && balances.length === 1) {
    return (
      <div className="w-fit rounded-full bg-foreground/[0.06] px-2.5 py-1 text-ui-caption text-muted-foreground">
        <span className="text-foreground tabular-nums">
          {formatToken(balances[0].lpt)} LPT
        </span>{" "}
        in wallet on {balances[0].network}
      </div>
    );
  }
  return (
    <Menu>
      <MenuTrigger className="flex w-fit cursor-pointer items-center gap-1 whitespace-nowrap rounded-full bg-foreground/[0.06] py-1 pr-2 pl-2.5 text-ui-caption text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.1] hover:text-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40 data-popup-open:bg-foreground/[0.1] data-popup-open:text-foreground">
        {label}
        <ChevronDown className="size-3 self-center opacity-80" />
      </MenuTrigger>
      <MenuContent align="start" className={readOnly ? "w-56" : "w-72"}>
        {balances.map((b, i) => (
          <Fragment key={b.key}>
            {i > 0 && !readOnly && <MenuSeparator />}
            <div
              className={cn(
                "flex items-baseline justify-between gap-3 px-2",
                readOnly ? "py-1.5" : "pt-2 pb-1"
              )}
            >
              <span className="text-ui-caption text-muted-foreground">
                On {b.network}
              </span>
              <span className="text-ui-body tabular-nums">
                {formatToken(b.lpt)} LPT
              </span>
            </div>
            {b.actions.map((a) =>
              a.href ? (
                <MenuItem key={a.label} render={<Link href={a.href} />}>
                  {a.icon} {a.label}
                  <ArrowRight className="ml-auto text-muted-foreground" />
                </MenuItem>
              ) : (
                <MenuItem key={a.label} onClick={a.onClick}>
                  {a.icon} {a.label}
                </MenuItem>
              )
            )}
          </Fragment>
        ))}
      </MenuContent>
    </Menu>
  );
}

export type HeadlineSlots = {
  label: React.ReactNode;
  /** The big number when it isn't delegated stake. */
  headline?: number;
  position: React.ReactNode;
  actions: React.ReactNode;
  balances: React.ReactNode;
};

/**
 * A single wallet's headline. The big number is the LPT that matters now:
 * its delegated stake when it has one; otherwise what it holds, labelled by
 * where ("On Ethereum"), or "In wallet" when it's on both networks. What
 * it holds besides its stake sits under it, in a chip by network.
 */
export function AccountHeadline({
  loading,
  position: p,
  canManage,
  freeLpt,
  render,
}: {
  loading: boolean;
  position: Position | undefined;
  canManage: boolean;
  freeLpt: number | undefined;
  render: (slots: HeadlineSlots) => React.ReactNode;
}) {
  const { open } = useStaking();
  const { bridge } = useBridge();
  const account = p?.account.address;
  const held = useHeld(account);
  // A delegate's line high, so the label keeps its height when one loads.
  const caption = (text: string) => (
    <div className="text-ui-caption leading-5 text-muted-foreground">
      {text}
    </div>
  );
  if (loading || !p || !account) {
    return render({
      label: caption("Delegated stake"),
      position: null,
      actions: canManage && <Skeleton className="h-8 w-56 rounded-md" />,
      balances: null,
    });
  }

  const browse = `/orchestrators?account=${account}`;
  const arbitrumBalance: Balance = {
    key: "arbitrum",
    network: "Arbitrum",
    lpt: held.arbitrum,
    actions: canManage
      ? [
          p.delegate
            ? {
                label: "Delegate",
                icon: <Plus />,
                onClick: () =>
                  open({
                    kind: "delegate",
                    to: p.delegate!,
                    account,
                    amount: freeLpt ?? held.arbitrum,
                  }),
              }
            : // No orchestrator yet: the same move, by way of choosing one.
              { label: "Delegate", icon: <Plus />, href: browse },
          {
            label: "Bridge to Ethereum",
            icon: <ArrowLeftRight />,
            onClick: () => bridge(account, "toEthereum"),
          },
        ]
      : [],
  };
  const ethereumBalance: Balance = {
    key: "ethereum",
    network: "Ethereum",
    lpt: held.ethereum,
    actions: canManage
      ? [
          {
            label: "Bridge to Arbitrum",
            icon: <ArrowLeftRight />,
            onClick: () => bridge(account, "toArbitrum"),
          },
        ]
      : [],
  };
  const chip = (balances: Balance[], total?: boolean) =>
    balances.length ? <BalanceChip balances={balances} total={total} /> : null;
  const note = (text: string) => (
    <p className="text-ui-body text-muted-foreground">{text}</p>
  );
  const browseButton = (primary: boolean) => (
    <Link
      href={browse}
      className={cn(
        buttonVariants({ variant: primary ? "primary" : "outline", size: "sm" })
      )}
    >
      Browse orchestrators
    </Link>
  );

  // Delegated: the stake leads; what isn't delegated sits under it.
  if (p.delegate) {
    return render({
      label: <DelegatedTo position={p} />,
      position: null,
      actions: canManage && (
        <DelegationActions
          position={p}
          delegate={p.delegate}
          freeLpt={freeLpt}
        />
      ),
      balances: chip(
        [
          ...(held.arbitrum ? [arbitrumBalance] : []),
          ...(held.ethereum ? [ethereumBalance] : []),
        ],
        true
      ),
    });
  }

  // Nothing delegated, LPT on both networks: the total leads, split below.
  if (held.arbitrum && held.ethereum) {
    return render({
      label: caption("In wallet"),
      headline: held.arbitrum + held.ethereum,
      position: null,
      actions: canManage && browseButton(true),
      balances: chip([arbitrumBalance, ethereumBalance]),
    });
  }

  // Nothing delegated, LPT on one network: that balance leads, and its next
  // step is the main button.
  if (held.ethereum) {
    return render({
      label: caption("On Ethereum"),
      headline: held.ethereum,
      position: note(
        canManage
          ? "Not delegated. Bridge it to Arbitrum to delegate it."
          : "Not delegated."
      ),
      actions: canManage && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => bridge(account, "toArbitrum")}
          >
            <ArrowLeftRight /> Bridge to Arbitrum
          </Button>
          {browseButton(false)}
        </div>
      ),
      balances: null,
    });
  }
  if (held.arbitrum) {
    return render({
      label: caption("On Arbitrum"),
      headline: held.arbitrum,
      position: note(
        canManage
          ? "Not delegated. Choose an orchestrator to start earning rewards and fees."
          : "Not delegated."
      ),
      actions: canManage && (
        <div className="flex items-center gap-2">
          {browseButton(true)}
          <Button size="sm" onClick={() => bridge(account, "toEthereum")}>
            <ArrowLeftRight /> Bridge to Ethereum
          </Button>
        </div>
      ),
      balances: null,
    });
  }

  // Nothing at all.
  return render({
    label: caption("Delegated stake"),
    position: note(
      canManage
        ? "Not delegated. Choose an orchestrator to start earning rewards and fees."
        : "Not delegated to an orchestrator right now."
    ),
    actions: canManage && browseButton(true),
    balances: null,
  });
}
