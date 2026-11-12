"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { zeroAddress } from "viem";
import { useAccount, useConfig } from "wagmi";
import { readContract } from "wagmi/actions";

import { useStaking } from "@/components/staking/staking";
import { bondingManager } from "@/lib/abis/BondingManager";
import { onDepositArrived, usePendingDeposits } from "@/lib/bridge/pending";
import type { TrackedDeposit } from "@/lib/bridge/types";
import { L2_CHAIN } from "@/lib/config";
import { formatLPT, fromWei } from "@/lib/format";
import { useProtocolContract } from "@/lib/staking/contracts";

/**
 * Says so when LPT bridged to Arbitrum lands, wherever you are in the app,
 * and offers the move most people bridged for: delegating it. Delegate adds
 * it to the wallet's current orchestrator, the whole balance filled in, or,
 * without one yet, opens the list to choose one. Watches the connected
 * wallet's deposits; any view watching others' announces those too.
 */
export function DepositArrivals() {
  const { address } = useAccount();
  const connected = address?.toLowerCase();
  const watching = useMemo(() => (connected ? [connected] : []), [connected]);
  // Mounted for its tracking: it's what notices an arrival.
  usePendingDeposits(watching);

  const { open } = useStaking();
  const router = useRouter();
  const config = useConfig();
  const bm = useProtocolContract("BondingManager");

  // The latest of each, for a toast's button pressed later.
  const latest = useRef({ connected, open, router, config, bm });
  useEffect(() => {
    latest.current = { connected, open, router, config, bm };
  });

  useEffect(
    () =>
      onDepositArrived((d: TrackedDeposit) => {
        const amount = formatLPT(fromWei(BigInt(d.amount)));
        const account = d.to.toLowerCase();
        const delegate = async () => {
          const { open, router, config, bm } = latest.current;
          let current: string | undefined;
          try {
            if (bm) {
              const info = await readContract(config, {
                address: bm,
                abi: bondingManager,
                functionName: "getDelegator",
                args: [account as `0x${string}`],
                chainId: L2_CHAIN.id,
              });
              current = info[2];
            }
          } catch {
            // Unknown: choosing an orchestrator still gets it delegated.
          }
          if (current && current !== zeroAddress) {
            open({ kind: "delegate", to: current, account, wholeWallet: true });
          } else {
            router.push(`/orchestrators?account=${account}`);
          }
        };
        toast.success(`${amount} arrived on Arbitrum`, {
          id: `deposit-arrived-${d.l1Tx}-${d.seq ?? ""}`,
          description: "Ready to delegate.",
          // Only the wallet it landed in can delegate it.
          action:
            latest.current.connected === account
              ? { label: "Delegate", onClick: () => void delegate() }
              : undefined,
        });
      }),
    []
  );

  return null;
}
