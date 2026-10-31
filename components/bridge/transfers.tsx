"use client";

import { ExternalLink } from "lucide-react";
import { useMemo } from "react";

import { useNow } from "@/components/shell/round-clock";
import { Button } from "@/components/ui/button";
import { l1TxUrl, retryableUrl } from "@/lib/bridge/config";
import { usePendingDeposits } from "@/lib/bridge/pending";
import {
  depositTiming,
  waitText,
  withdrawalProgress,
} from "@/lib/bridge/progress";
import { useBridgeWithdrawals } from "@/lib/bridge/withdrawals";
import { txUrl } from "@/lib/config";
import { formatDate, formatLPT, fromWei } from "@/lib/format";

import { useBridge } from "./context";

/** A thin bar for a countdown, as in the Pending card. */
export function Progress({ value }: { value: number }) {
  return (
    <div className="h-[3px] overflow-hidden rounded-full bg-hover">
      <div
        className="h-full rounded-full bg-muted-foreground/70 transition-[width]"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

/** One transfer: amount and direction, linked to its transaction. */
function Leg({
  amount,
  to,
  href,
}: {
  amount: string;
  to: "Arbitrum" | "Ethereum";
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="min-w-0 truncate hover:underline"
    >
      <span className="font-medium tabular-nums">{amount}</span>{" "}
      <span className="text-muted-foreground">to {to}</span>
    </a>
  );
}

/**
 * A wallet's LPT on its way between the networks, either direction, worded
 * as in the Pending card: a deposit "Arrives in" (it lands by itself), a
 * withdrawal "Claim in" (it needs a claim), with the action once there is
 * one.
 */
export function Transfers({ wallet }: { wallet: string }) {
  const addresses = useMemo(() => [wallet], [wallet]);
  // Includes withdrawals just sent from this browser, before they're indexed.
  const { data: withdrawals = [] } = useBridgeWithdrawals(addresses);
  const deposits = usePendingDeposits(addresses);
  const { claim } = useBridge();
  const nowSec = Math.floor(useNow(30_000) / 1000);
  if (!withdrawals.length && !deposits.length) return null;

  const sorted = [...withdrawals].sort(
    (a, b) =>
      Number(b.status === "ready") - Number(a.status === "ready") ||
      b.timestamp - a.timestamp
  );

  return (
    <div className="-mx-5 mt-1 flex flex-col gap-3 border-t border-hairline px-5 pt-4">
      <span className="text-ui-caption text-muted-foreground">
        Your transfers
      </span>
      {deposits.map((d) => {
        const amount = formatLPT(fromWei(BigInt(d.amount)));
        if (d.status === "retry") {
          return (
            <div
              key={`${d.l1Tx}-${d.seq ?? ""}`}
              className="flex flex-col gap-1"
            >
              <div className="flex items-center justify-between gap-3 text-ui-body">
                <Leg amount={amount} to="Arbitrum" href={l1TxUrl(d.l1Tx)} />
                {/* Anyone can retry it; the LPT still goes to the recipient. */}
                <Button
                  size="xs"
                  variant="primary"
                  render={
                    <a
                      href={retryableUrl(d.l1Tx)}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  Retry <ExternalLink className="size-3" />
                </Button>
              </div>
              <span className="text-ui-caption text-warm">
                Arbitrum couldn&apos;t finish it · retry by{" "}
                {formatDate(d.retryBy!)}
              </span>
            </div>
          );
        }
        const { minutesLeft, progress } = depositTiming(d.sentAt, nowSec);
        return (
          <div
            key={`${d.l1Tx}-${d.seq ?? ""}`}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-baseline justify-between gap-3 text-ui-body">
              <Leg amount={amount} to="Arbitrum" href={l1TxUrl(d.l1Tx)} />
              <span className="shrink-0 text-ui-caption text-muted-foreground tabular-nums">
                Arrives in{" "}
                {minutesLeft > 0 ? `~${minutesLeft} min` : "a moment"}
              </span>
            </div>
            <Progress value={progress} />
          </div>
        );
      })}
      {sorted.map((w) => {
        const amount = formatLPT(fromWei(BigInt(w.amount)));
        if (w.status === "ready") {
          return (
            <div
              key={w.id}
              className="flex items-center justify-between gap-3 text-ui-body"
            >
              <Leg amount={amount} to="Ethereum" href={txUrl(w.tx)} />
              <span className="flex shrink-0 items-center gap-2.5">
                <span className="text-ui-caption text-green-bright">
                  Ready to claim
                </span>
                {/* Any wallet can claim: the LPT goes to the recipient. */}
                <Button size="xs" variant="primary" onClick={() => claim(w)}>
                  Claim
                </Button>
              </span>
            </div>
          );
        }
        return (
          <div key={w.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-ui-body">
              <Leg amount={amount} to="Ethereum" href={txUrl(w.tx)} />
              <span
                className="shrink-0 text-ui-caption text-muted-foreground tabular-nums"
                title={`Claimable around ${formatDate(w.readyAt!)}`}
              >
                Claim in {waitText(w.readyAt! - nowSec)}
              </span>
            </div>
            <Progress value={withdrawalProgress(w, nowSec)} />
          </div>
        );
      })}
    </div>
  );
}
