"use client";

import { ChevronDown, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useReadContracts } from "wagmi";

import { useIdentity } from "@/components/identity";
import { useStaking } from "@/components/staking/staking";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/misc";
import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { trackEvent } from "@/lib/analytics";
import { L2_CHAIN } from "@/lib/config";
import { formatLPT, fromWei, shortAddress } from "@/lib/format";
import type { PortfolioAccount } from "@/lib/hooks/watchlist";
import { useProtocolContract } from "@/lib/staking/contracts";

import type { Position } from "./positions";

/** Below this, a balance is dust rather than something to delegate. */
const IDLE_MIN = 1;

/** Unstaked LPT per address, in LPT; only addresses holding at least 1. */
export function useIdleLpt(addresses: string[]) {
  const token = useProtocolContract("LivepeerToken");
  const { data } = useReadContracts({
    contracts: addresses.map((a) => ({
      address: token,
      abi: livepeerToken,
      functionName: "balanceOf",
      args: [a as `0x${string}`],
      chainId: L2_CHAIN.id,
    })),
    query: { enabled: Boolean(token) && addresses.length > 0 },
  });
  return useMemo(() => {
    const out = new Map<string, number>();
    data?.forEach((r, i) => {
      if (r.status !== "success") return;
      const lpt = fromWei(r.result as bigint);
      if (lpt >= IDLE_MIN) out.set(addresses[i], lpt);
    });
    return out;
  }, [data, addresses]);
}

function Name({ address, label }: { address: string; label?: string }) {
  const { name } = useIdentity(address);
  return <>{label ?? name ?? shortAddress(address)}</>;
}

/**
 * LPT sitting unstaked in the portfolio's wallets, just bought or just
 * withdrawn: the moment someone most wants to delegate. A short action in
 * the Delegations header, above the rows it would change. Offers to add it
 * to the wallet's orchestrator, or to choose one when it has none.
 */
export function IdleLptAction({
  idle,
  accounts,
  positions,
}: {
  idle: Map<string, number>;
  accounts: PortfolioAccount[];
  positions: Position[];
}) {
  const { open } = useStaking();
  const wallets = [...idle.entries()]
    .map(([address, lpt]) => ({
      address,
      lpt,
      label: accounts.find((a) => a.address === address)?.label,
      delegate:
        positions.find((p) => p.account.address === address)?.delegate ?? null,
    }))
    .sort((a, b) => b.lpt - a.lpt);
  if (!wallets.length) return null;

  const total = wallets.reduce((s, w) => s + w.lpt, 0);
  // The plan's Earn entry point: a prompt to put idle LPT to work.
  const trackEntry = () =>
    trackEvent("earn_entry_point_clicked", { surface: "unstaked_lpt" });
  const delegate = (w: (typeof wallets)[number]) => {
    if (!w.delegate) return;
    trackEntry();
    open({
      kind: "delegate",
      to: w.delegate,
      account: w.address,
      amount: w.lpt,
    });
  };

  const [only] = wallets;
  const action =
    wallets.length > 1 ? (
      <Menu>
        <MenuTrigger
          render={
            <Button size="xs" variant="outline" className="rounded-full" />
          }
        >
          <Plus /> Delegate <ChevronDown className="size-3 opacity-60" />
        </MenuTrigger>
        <MenuContent align="end" className="w-72">
          {wallets.map((w) =>
            w.delegate ? (
              <MenuItem key={w.address} onClick={() => delegate(w)}>
                <span className="min-w-0 flex-1 truncate">
                  <Name address={w.address} label={w.label} /> →{" "}
                  <Name address={w.delegate} />
                </span>
                <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
                  {formatLPT(w.lpt, { compact: true })}
                </span>
              </MenuItem>
            ) : null
          )}
          <MenuSeparator />
          <MenuItem
            render={<Link href="/orchestrators" />}
            onClick={trackEntry}
          >
            <Search /> Choose an orchestrator
          </MenuItem>
        </MenuContent>
      </Menu>
    ) : only.delegate ? (
      <Button
        size="xs"
        variant="outline"
        className="rounded-full"
        onClick={() => delegate(only)}
      >
        <Plus /> Delegate
      </Button>
    ) : (
      <Button
        size="xs"
        variant="outline"
        className="rounded-full"
        render={<Link href="/orchestrators" />}
        onClick={trackEntry}
      >
        <Search /> Choose orchestrator
      </Button>
    );

  return (
    <div className="flex items-center gap-2.5 text-ui-caption whitespace-nowrap text-muted-foreground">
      <span>
        <span className="font-mono text-foreground tabular-nums">
          {formatLPT(total)}
        </span>{" "}
        unstaked
      </span>
      {action}
    </div>
  );
}
