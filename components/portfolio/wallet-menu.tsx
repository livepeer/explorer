"use client";

import { ArrowLeftRight, ChevronDown, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useReadContract } from "wagmi";

import { useBridge } from "@/components/bridge/context";
import { useStaking } from "@/components/staking/staking";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/misc";
import { bondingManager } from "@/lib/abis/BondingManager";
import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { useL1Lpt } from "@/lib/bridge/withdrawals";
import { L2_CHAIN } from "@/lib/config";
import { formatLPT, fromWei } from "@/lib/format";
import { useProtocolContract } from "@/lib/staking/contracts";

import { LPT_DUST } from "./positions";

/** A balance's heading in the menu: where it is, and how much. */
function Heading({
  network,
  lpt,
}: {
  network: "Arbitrum" | "Ethereum";
  lpt: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-2 pt-2 pb-1">
      <span className="text-ui-caption text-muted-foreground">
        On {network}
      </span>
      <span className="text-ui-body tabular-nums">{formatLPT(lpt)}</span>
    </div>
  );
}

/**
 * The account's LPT that isn't delegated, as a quiet line under the
 * headline: "1.07 LPT not delegated", the secondary-balance convention.
 * It opens a menu with each balance by network and every move it allows,
 * so nothing assumes intent: LPT on Arbitrum can be delegated or bridged
 * to Ethereum; LPT on Ethereum can be bridged over.
 * For an account you can't act for, the menu shows the balances alone.
 * Nothing beyond what's delegated, no line. It reads its own figures.
 */
export function WalletMenu({
  account,
  canManage,
}: {
  account: string;
  canManage: boolean;
}) {
  const { open } = useStaking();
  const { bridge } = useBridge();
  const bm = useProtocolContract("BondingManager");
  const token = useProtocolContract("LivepeerToken");
  const addr = account as `0x${string}`;
  const { data: l2Wei } = useReadContract({
    address: token,
    abi: livepeerToken,
    functionName: "balanceOf",
    args: [addr],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(token), staleTime: 60_000 },
  });
  const { data: delegator } = useReadContract({
    address: bm,
    abi: bondingManager,
    functionName: "getDelegator",
    args: [addr],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(bm), staleTime: 60_000 },
  });
  const addresses = useMemo(() => [account], [account]);
  const l1 = useL1Lpt(addresses);

  const delegateAddress = (delegator as readonly unknown[] | undefined)?.[2] as
    | string
    | undefined;
  const delegate =
    delegateAddress && !/^0x0+$/.test(delegateAddress)
      ? delegateAddress.toLowerCase()
      : null;
  const free = l2Wei != null ? fromWei(l2Wei as bigint) : 0;
  const available = free >= LPT_DUST ? free : 0;
  const onEthereum = l1.get(account) ?? 0;
  if (!available && !onEthereum) return null;
  const idle = available + onEthereum;

  return (
    <Menu>
      {/* A soft chip, so it reads as something that opens. */}
      <MenuTrigger className="mt-1 flex w-fit cursor-pointer items-center gap-1 rounded-full bg-foreground/[0.06] py-1 pr-2 pl-2.5 text-ui-caption text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.1] hover:text-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40 data-popup-open:bg-foreground/[0.1] data-popup-open:text-foreground">
        <span className="text-foreground tabular-nums">{formatLPT(idle)}</span>
        not delegated
        <ChevronDown className="size-3 opacity-80" />
      </MenuTrigger>
      <MenuContent align="start" className="w-72">
        {available > 0 && (
          <>
            <Heading network="Arbitrum" lpt={available} />
            {canManage &&
              (delegate ? (
                <MenuItem
                  onClick={() =>
                    open({
                      kind: "delegate",
                      to: delegate,
                      account,
                      amount: available,
                    })
                  }
                >
                  <Plus /> Delegate
                </MenuItem>
              ) : (
                <MenuItem
                  render={<Link href={`/orchestrators?account=${account}`} />}
                >
                  <Search /> Choose an orchestrator
                </MenuItem>
              ))}
            {canManage && (
              <MenuItem onClick={() => bridge(account, "toEthereum")}>
                <ArrowLeftRight /> Bridge to Ethereum
              </MenuItem>
            )}
          </>
        )}
        {available > 0 && onEthereum > 0 && <MenuSeparator />}
        {onEthereum > 0 && (
          <>
            <Heading network="Ethereum" lpt={onEthereum} />
            {canManage && (
              <MenuItem onClick={() => bridge(account, "toArbitrum")}>
                <ArrowLeftRight /> Bridge to Arbitrum
              </MenuItem>
            )}
          </>
        )}
      </MenuContent>
    </Menu>
  );
}
