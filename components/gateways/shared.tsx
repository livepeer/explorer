"use client";

import Link from "next/link";

import { Sparkline } from "@/components/charts/time-series";
import { Avatar, useIdentity } from "@/components/identity";
import { formatDate, shortAddress } from "@/lib/format";
import { dailyFees, type GatewayDay } from "@/lib/subgraph/gateways";

const DAY = 86400;

export const GATEWAY_HINT =
  "Gateways send video and AI jobs to orchestrators and pay for them in ETH through probabilistic tickets. Those fees are what orchestrators share with their delegators.";

export const RUNWAY_HINT =
  "How long the deposit lasts at the gateway's pace over the last 30 days. When the deposit runs out, the reserve backs its tickets until it's topped up.";

/** "Today", "3d ago", or a date once it's been a while. Day-level data. */
export function formatLastDay(date: number, nowSec = Date.now() / 1000) {
  if (!date) return "—";
  const days = Math.floor((Math.floor(nowSec / DAY) * DAY - date) / DAY);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 60) return `${days}d ago`;
  return formatDate(date, { month: "short", day: "numeric", year: "numeric" });
}

export function formatRunway(days: number | null) {
  if (days == null) return "—";
  if (days < 1) return "< 1 day";
  if (days > 365) return "1 year+";
  return `~${Math.round(days)} days`;
}

/** Weekly totals over the last 13 weeks, for a table-cell trend line. */
export function WeeklyTrend({ days }: { days: GatewayDay[] }) {
  const daily = dailyFees(days, 91);
  const weeks: number[] = [];
  for (let i = 0; i < daily.length; i += 7)
    weeks.push(daily.slice(i, i + 7).reduce((s, d) => s + d.volumeETH, 0));
  return <Sparkline values={weeks} width={64} height={20} />;
}

export function GatewayName({ id, rank }: { id: string; rank?: number }) {
  const { name, avatar } = useIdentity(id);
  return (
    <Link
      href={`/gateways/${id}`}
      className="flex min-w-0 items-center gap-3 outline-none"
    >
      {rank != null && (
        <span className="w-6 shrink-0 text-right font-mono text-[11px] text-subtle-foreground tabular-nums">
          {rank}
        </span>
      )}
      <Avatar address={id} src={avatar} size={28} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-ui-body text-foreground group-hover:underline group-hover:decoration-foreground/30 group-hover:underline-offset-4">
          {name ?? (
            <span className="font-mono text-[13px]">{shortAddress(id)}</span>
          )}
        </span>
        {name && (
          <span className="font-mono text-[11px] text-subtle-foreground">
            {shortAddress(id)}
          </span>
        )}
      </span>
    </Link>
  );
}
