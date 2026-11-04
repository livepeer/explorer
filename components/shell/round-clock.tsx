"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { formatDuration, formatLPT } from "@/lib/format";
import { useProtocol } from "@/lib/hooks/queries";
import { fetchRewardProgress, type Protocol } from "@/lib/subgraph/network";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function roundState(p: Protocol, nowMs: number) {
  const elapsed = Math.max(0, nowMs / 1000 - p.roundStartTs);
  const remaining = p.roundSeconds - elapsed;
  const progress = Math.min(1, Math.max(0, elapsed / p.roundSeconds));
  const blocksElapsed = Math.min(
    p.roundLength,
    Math.floor(elapsed / p.secondsPerBlock)
  );
  return {
    progress,
    remaining,
    overdue: remaining <= 0,
    initialized: p.lastInitializedRound >= p.currentRound,
    endsAt: (p.roundStartTs + p.roundSeconds) * 1000,
    blocksElapsed,
  };
}

/**
 * A round turning over: the ring closes, ripples once as it does, then
 * unwinds into the top, its tail chasing round after its head, so the new
 * round's arc grows from nothing instead of the full ring vanishing.
 */
export type TurnPhase = "fill" | "unwind" | "reset";

const TURN_MS = { unwind: 1000, reset: 1750, done: 2600 };

export function Ring({
  progress,
  size = 28,
  stroke = 3,
  tone = "positive",
  turn,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  tone?: "positive" | "warning";
  /** Where a round turning over has got to (see useRoundTurn). */
  turn?: TurnPhase | null;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const shown = turn === "fill" ? 1 : progress;
  // Unwinding slides the dash forward off the end of the circle.
  const offset = turn === "unwind" ? -c : c * (1 - shown);
  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      {turn && (
        // Hidden but for the ripple, which waits for the ring to close.
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-green-bright opacity-0 motion-safe:animate-[ring-turn_900ms_var(--ease-out)_420ms]"
        />
      )}
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-foreground/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          // Round caps add half the stroke at each end, so a short arc
          // (a round just begun) would draw as a blob: square ends until
          // the arc is long enough for the caps to read as an arc.
          // Square ends while unwinding too, so the closing tail leaves no
          // dot behind at the top.
          strokeLinecap={
            turn !== "unwind" && c * shown > stroke * 2 ? "round" : "butt"
          }
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(
            turn === "fill"
              ? "transition-[stroke-dashoffset,stroke] duration-500 ease-out"
              : turn === "unwind"
              ? "transition-[stroke-dashoffset] duration-700 ease-in-out"
              : // Back to the start in one frame, from an empty ring.
              turn === "reset"
              ? undefined
              : "transition-[stroke-dashoffset,stroke] duration-1000 ease-linear",
            tone === "positive" ? "stroke-green-fill" : "stroke-warm"
          )}
        />
      </svg>
      {children && (
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </span>
      )}
    </span>
  );
}

type Turn = { from: number; to: number; phase: TurnPhase };

/**
 * A round turning over while the explorer is open: the ring fills and
 * ripples, then starts again, and a toast says how the last round went.
 * Not on first load; only a change seen live.
 */
export function useRoundTurn(round: number | undefined) {
  // Noticed during render, so the new number and the celebration arrive
  // in the same frame rather than one after the other.
  const [last, setLast] = useState(round);
  const [turn, setTurn] = useState<Turn | null>(null);
  if (round !== last) {
    setLast(round);
    if (last != null && round != null && round > last)
      setTurn({ from: last, to: round, phase: "fill" });
  }

  const queryClient = useQueryClient();
  const router = useRouter();
  const to = turn?.to;
  const from = turn?.from;

  useEffect(() => {
    if (to == null || from == null) return;
    const phase = (p: TurnPhase) => () =>
      setTurn((t) => t && { ...t, phase: p });
    const timers = [
      setTimeout(phase("unwind"), TURN_MS.unwind),
      setTimeout(phase("reset"), TURN_MS.reset),
      setTimeout(() => setTurn(null), TURN_MS.done),
    ];

    // One toast per round, however many clocks are mounted.
    const id = `round-${to}`;
    const title = `Round ${to.toLocaleString()} has started`;
    const action = {
      label: "Network",
      onClick: () => router.push("/network"),
    };
    const duration = 8000;
    toast(title, { id, action, duration });
    queryClient
      .fetchQuery({
        queryKey: ["reward-progress", from],
        queryFn: () => fetchRewardProgress(from),
        staleTime: 10_000,
      })
      .then((p) => {
        if (!p.total) return;
        toast(title, {
          id,
          action,
          duration,
          description: `${p.called} of ${
            p.total
          } orchestrators called reward in round ${from.toLocaleString()}, minting ${formatLPT(
            p.minted,
            { compact: true }
          )}.`,
        });
      })
      .catch(() => {});

    return () => timers.forEach(clearTimeout);
  }, [to, from, queryClient, router]);

  return turn;
}

/** Compact, always-visible protocol heartbeat for the sidebar. */
export function SidebarRoundClock() {
  const { data } = useProtocol();
  const now = useNow(1000);
  const turn = useRoundTurn(data?.currentRound);

  if (!data) {
    return (
      <div className="flex items-center gap-3 px-2 py-2">
        <span className="size-7 animate-shimmer rounded-full bg-foreground/[0.06]" />
        <span className="flex flex-col gap-1.5">
          <span className="h-3 w-20 animate-shimmer rounded-sm bg-foreground/[0.06]" />
          <span className="h-2.5 w-14 animate-shimmer rounded-sm bg-foreground/[0.06]" />
        </span>
      </div>
    );
  }

  const s = roundState(data, now);
  const endsAt = new Date(s.endsAt).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Tooltip
      side="right"
      content={
        <span className="flex flex-col gap-0.5">
          <span>
            {s.overdue
              ? `Round ${data.currentRound + 1} can be initialized now`
              : `Round ${data.currentRound + 1} starts around ${endsAt}`}
          </span>
          <span className="opacity-70">
            ~{s.blocksElapsed.toLocaleString()} of{" "}
            {data.roundLength.toLocaleString()} L1 blocks
          </span>
        </span>
      }
    >
      <Link
        href="/network"
        className="flex items-center gap-3 rounded-sm px-2 py-2 transition-colors hover:bg-hover"
      >
        <Ring
          progress={s.progress}
          turn={turn?.phase}
          tone={turn || !(s.overdue || !s.initialized) ? "positive" : "warning"}
        />
        <span className="flex min-w-0 flex-col">
          <span className="text-ui-caption text-foreground">
            Round{" "}
            <span
              key={data.currentRound}
              className={cn(
                "inline-block tabular-nums transition-colors duration-700",
                turn && "text-green-bright motion-safe:animate-rise"
              )}
            >
              {data.currentRound.toLocaleString()}
            </span>
          </span>
          <span className="text-ui-caption text-muted-foreground tabular-nums">
            {s.overdue
              ? "Ready to initialize"
              : `${formatDuration(s.remaining)} left`}
          </span>
        </span>
      </Link>
    </Tooltip>
  );
}
