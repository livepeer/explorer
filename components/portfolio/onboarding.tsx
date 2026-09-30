"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  ArrowRight,
  Layers,
  LineChart,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Avatar, useIdentity } from "@/components/identity";
import { Card, Kpi, KpiStrip, SectionHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { trackEvent } from "@/lib/analytics";
import { formatLPT, formatPercent, shortAddress } from "@/lib/format";
import { useOrchestrators, usePrices, useProtocol } from "@/lib/hooks/queries";
import { feeApr, rankByYield } from "@/lib/orchestrators/ranking";

import { AddAddressDialog } from "./addresses";

/** The plan's Earn entry point: a way into choosing an orchestrator. */
const trackEntry = () =>
  trackEvent("earn_entry_point_clicked", { surface: "onboarding" });

function OrchestratorRow({
  id,
  apr,
  stake,
  calls,
  window,
}: {
  id: string;
  apr: number | null;
  stake: number;
  calls: number;
  window: number;
}) {
  const { name, avatar } = useIdentity(id);
  return (
    <Link
      href={`/orchestrators/${id}`}
      onClick={trackEntry}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover"
    >
      <Avatar address={id} src={avatar} size={26} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-ui-body">
          {name ?? (
            <span className="font-mono text-[13px]">{shortAddress(id)}</span>
          )}
        </span>
        <span className="block text-ui-caption text-muted-foreground">
          {formatLPT(stake, { compact: true })} staked · {calls}/{window} reward
          calls
        </span>
      </span>
      <span className="text-right">
        <span className="block font-mono text-[13px] tabular-nums">
          {apr != null ? `${apr.toFixed(1)}%` : "—"}
        </span>
        <span className="block text-[11px] text-muted-foreground">
          realised APR
        </span>
      </span>
    </Link>
  );
}

export function Onboarding() {
  const { openConnectModal } = useConnectModal();
  const [tracking, setTracking] = useState(false);
  const { data: protocol } = useProtocol();
  const { data: orchestrators } = useOrchestrators();
  const { data: prices } = usePrices();

  // The Orchestrators list with "Reliable only" on: ranked by expected yield,
  // ties to the smaller orchestrator, and reward called in every round.
  const reliable = useMemo(() => {
    const lptPerEth =
      prices?.eth && prices?.lpt ? prices.eth / prices.lpt : null;
    const listed = (orchestrators ?? []).map((o) => ({
      ...o,
      feeApr: lptPerEth ? feeApr(o, lptPerEth) : null,
    }));
    return rankByYield(listed).ranked.filter(
      (o) => o.rewardCalls >= o.rewardWindow
    );
  }, [orchestrators, prices]);
  const medianApr = useMemo(() => {
    const aprs = reliable
      .map((o) => o.realizedApr)
      .filter((a): a is number => a != null)
      .sort((a, b) => a - b);
    return aprs.length ? aprs[Math.floor(aprs.length / 2)] : null;
  }, [reliable]);

  return (
    <div className="flex flex-col gap-12">
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(80% 120% at 100% 0%, color-mix(in srgb, var(--green-bright) 10%, transparent), transparent 60%)",
          }}
        />
        <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <span className="text-ui-caption text-green-bright">Portfolio</span>
            <h1 className="text-display-sm font-light tracking-[-0.02em] text-balance sm:text-display-md">
              Know exactly what your stake is earning.
            </h1>
            <p className="max-w-[48ch] text-[15px] leading-6 text-muted-foreground">
              Every round&apos;s rewards and fees, across every wallet you hold.
              Spot an orchestrator slipping before it costs you, and act on it
              without leaving the page.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="lg"
                onClick={() => openConnectModal?.()}
              >
                <Wallet /> Connect wallet
              </Button>
              <Button size="lg" onClick={() => setTracking(true)}>
                <Plus /> Add an address
              </Button>
            </div>
          </div>

          <ul className="flex flex-col gap-4">
            {[
              {
                icon: LineChart,
                title: "True earnings history",
                text: "Rewards and fees reconstructed per round, not guessed from balance changes.",
              },
              {
                icon: Layers,
                title: "All your wallets together",
                text: "Connect a wallet and add any other address, like cold storage or a multisig, to see them as one.",
              },
              {
                icon: ShieldCheck,
                title: "Early warnings",
                text: "Missed reward calls, cut changes and inactive orchestrators surface on their own.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-hairline bg-background/50 text-muted-foreground light:bg-background">
                  <Icon className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-ui-body font-medium">{title}</span>
                  <span className="text-ui-caption text-muted-foreground">
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <section>
        <SectionHeader title="The network today" />
        <KpiStrip>
          <Kpi
            label="Participation"
            value={
              protocol ? (
                formatPercent(protocol.participationRate)
              ) : (
                <Skeleton className="h-6 w-24" />
              )
            }
            sub={
              protocol
                ? `${formatLPT(protocol.totalActiveStake, {
                    compact: true,
                  })} staked · target ${formatPercent(
                    protocol.targetBondingRate,
                    { decimals: 0 }
                  )}`
                : undefined
            }
          />
          <Kpi
            label="Median realised APR"
            value={
              medianApr != null ? (
                `${medianApr.toFixed(1)}%`
              ) : (
                <Skeleton className="h-6 w-16" />
              )
            }
            sub="Reliable orchestrators, last 30 rounds"
          />
          <Kpi
            label="Delegators"
            value={
              protocol ? (
                protocol.delegatorsCount.toLocaleString()
              ) : (
                <Skeleton className="h-6 w-16" />
              )
            }
            sub={
              protocol
                ? `${protocol.activeTranscoderCount} active orchestrators`
                : undefined
            }
          />
          <Kpi
            label="Current round"
            value={
              protocol ? (
                protocol.currentRound.toLocaleString()
              ) : (
                <Skeleton className="h-6 w-16" />
              )
            }
            sub={
              protocol
                ? `Inflation ${(protocol.inflation / 1e7).toFixed(4)}% / round`
                : undefined
            }
          />
        </KpiStrip>
      </section>

      <section>
        <SectionHeader
          title="Reliable orchestrators"
          description="Highest realised delegator yield among orchestrators that called reward every round"
          action={
            <Link
              href="/orchestrators"
              onClick={trackEntry}
              className="inline-flex items-center gap-1 text-ui-caption text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <Card className="divide-y divide-(--hairline)">
          {orchestrators
            ? reliable
                .slice(0, 5)
                .map((o) => (
                  <OrchestratorRow
                    key={o.id}
                    id={o.id}
                    apr={o.realizedApr}
                    stake={o.totalStake}
                    calls={o.rewardCalls}
                    window={o.rewardWindow}
                  />
                ))
            : Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-3.5 w-1/3" />
                </div>
              ))}
        </Card>
      </section>

      <AddAddressDialog open={tracking} onOpenChange={setTracking} />
    </div>
  );
}
