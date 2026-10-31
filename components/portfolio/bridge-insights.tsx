"use client";

import { useMemo } from "react";

import { useIdentity } from "@/components/identity";
import { retryableUrl } from "@/lib/bridge/config";
import { usePendingDeposits } from "@/lib/bridge/pending";
import { formatDate, formatLPT, fromWei, shortAddress } from "@/lib/format";
import type { PortfolioAccount } from "@/lib/hooks/watchlist";

import type { Insight } from "./side-panels";

function WalletName({
  address,
  accounts,
}: {
  address: string;
  accounts: PortfolioAccount[];
}) {
  const { name } = useIdentity(address);
  const label = accounts.find((a) => a.address === address)?.label;
  return (
    <span className="text-foreground">
      {label ?? name ?? shortAddress(address)}
    </span>
  );
}

/**
 * The bridge's part of Needs attention: only a deposit whose automatic
 * finish failed, which must be retried before its ticket expires or the
 * LPT is lost. As a warning it also raises the page's alert banner.
 * Everything else, claims included, is in the Pending card: a ready claim
 * has no deadline, so repeating it here would only duplicate that row.
 */
export function useBridgeInsights(
  addresses: string[],
  accounts: PortfolioAccount[]
): Insight[] {
  const deposits = usePendingDeposits(addresses);

  return useMemo(
    () =>
      deposits
        .filter((d) => d.status === "retry")
        .map((d) => ({
          id: `deposit-${d.l1Tx}-${d.seq ?? ""}`,
          tone: "warning" as const,
          kind: "bridge" as const,
          href: retryableUrl(d.l1Tx),
          external: true,
          title: (
            <>
              {formatLPT(fromWei(BigInt(d.amount)))} bridged to{" "}
              <WalletName address={d.to} accounts={accounts} /> needs a retry on
              Arbitrum
            </>
          ),
          detail: `Arbitrum couldn't finish it automatically. Retry it with Arbitrum's tool by ${formatDate(
            d.retryBy!
          )}, or the deposit expires. Anyone can retry it; the LPT still goes to the recipient.`,
        })),
    [deposits, accounts]
  );
}
