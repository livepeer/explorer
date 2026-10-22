"use client";

import { useEffect, useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  useActiveTooltipDataPoints,
  XAxis,
  YAxis,
} from "recharts";

import { formatDate } from "@/lib/format";

export type Point = { ts: number; value: number; round?: number };

/** A chart row: an actual value, a projected one, or both where they meet. */
type Row = {
  ts: number;
  value?: number;
  projected?: number;
  /** A second series drawn inside the first (e.g. staked within supply). */
  inner?: number;
  round?: number;
};

/** Names for the two series when the chart draws one inside the other. */
type Layers = { outer: string; inner: string };

const AXIS_TICK = { fill: "var(--subtle-foreground)", fontSize: 11 };

function ChartTooltip({
  active,
  payload,
  format,
  title,
  layers,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  format: (v: number) => string;
  title?: (p: Point) => string;
  layers?: Layers;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const projected = row.value == null;
  const p: Point = { ...row, value: row.value ?? row.projected ?? 0 };
  return (
    <div className="rounded-lg border border-hairline bg-popover px-3 py-2 shadow-(--shadow-popover)">
      <div className="text-ui-caption text-muted-foreground">
        {projected && "Projected · "}
        {title
          ? title(p)
          : `${formatDate(p.ts, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}${p.round ? ` · Round ${p.round.toLocaleString()}` : ""}`}
      </div>
      {layers && row.inner != null ? (
        <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-[12px] tabular-nums">
          <dt className="text-muted-foreground">{layers.outer}</dt>
          <dd className="text-right font-medium text-foreground">
            {format(p.value)}
          </dd>
          <dt className="text-muted-foreground">{layers.inner}</dt>
          <dd className="text-right font-medium text-foreground">
            {format(row.inner)}
            {p.value > 0 && (
              <span className="font-normal text-muted-foreground">
                {" "}
                · {Math.round((row.inner / p.value) * 100)}%
              </span>
            )}
          </dd>
        </dl>
      ) : (
        <div className="mt-0.5 text-ui-body font-medium text-foreground tabular-nums">
          {format(p.value)}
        </div>
      )}
    </div>
  );
}

/** Reports the hovered row's timestamp (null when nothing is) to a parent. */
function ActiveReporter({
  onActive,
}: {
  onActive: (ts: number | null) => void;
}) {
  const points = useActiveTooltipDataPoints<Row>();
  const ts = points?.[0]?.ts ?? null;
  useEffect(() => onActive(ts), [ts, onActive]);
  useEffect(() => () => onActive(null), [onActive]);
  return null;
}

function tickDate(spanDays: number) {
  return (ts: number) =>
    formatDate(
      ts,
      spanDays > 400
        ? { month: "short", year: "2-digit" }
        : { month: "short", day: "numeric" }
    );
}

export function TimeSeriesChart({
  data,
  color = "var(--series-1)",
  kind = "area",
  height = 240,
  format,
  axisFormat,
  reference,
  tooltipTitle,
  domain,
  ariaLabel,
  projection,
  yTicks,
  inner,
  onActive,
  hideTooltip,
}: {
  /**
   * Called with the hovered point's timestamp, and null when the pointer
   * leaves, for a readout outside the chart. Keep the function stable.
   */
  onActive?: (ts: number | null) => void;
  /** Keep the hover line but drop the tooltip box, when a readout shows it. */
  hideTooltip?: boolean;
  data: Point[];
  /**
   * A second series, one value per point of `data`, drawn as an area inside
   * the first: the first becomes a quiet outline, the second the coloured
   * fill (e.g. staked LPT within the total supply). Area charts only.
   */
  inner?: { values: number[]; color: string; layers: Layers };
  /**
   * Where the series is heading, drawn dashed from the last actual point.
   * Points after the data, oldest first.
   */
  projection?: Point[];
  /** Exact y-axis ticks, when the scale should land on known values. */
  yTicks?: number[];
  color?: string;
  kind?: "area" | "bar";
  height?: number;
  format: (v: number) => string;
  axisFormat?: (v: number) => string;
  /** A dashed level with a label, on the right unless `side` says left. */
  reference?: { value: number; label: string; side?: "left" | "right" };
  tooltipTitle?: (p: Point) => string;
  domain?: [
    number | "auto" | "dataMin" | "dataMax",
    number | "auto" | "dataMin" | "dataMax"
  ];
  ariaLabel: string;
}) {
  const id = useId().replace(/:/g, "");
  const base: Row[] = inner
    ? data.map((p, i) => ({ ...p, inner: inner.values[i] }))
    : data;
  const last = base[base.length - 1];
  const rows: Row[] =
    projection?.length && last
      ? [
          ...base.slice(0, -1),
          // The last actual point starts the projection, so the lines meet.
          { ...last, projected: last.value ?? 0 },
          ...projection.map((p) => ({ ts: p.ts, projected: p.value })),
        ]
      : base;
  const spanDays =
    rows.length > 1 ? (rows[rows.length - 1].ts - rows[0].ts) / 86400 : 0;

  const common = {
    data: rows,
    margin: { top: 8, right: 4, bottom: 0, left: 0 },
    accessibilityLayer: true,
  };

  const grid = <CartesianGrid vertical={false} stroke="var(--hairline)" />;
  const xAxis = (
    <XAxis
      dataKey="ts"
      type="number"
      scale="time"
      domain={["dataMin", "dataMax"]}
      tickFormatter={tickDate(spanDays)}
      tick={AXIS_TICK}
      axisLine={false}
      tickLine={false}
      minTickGap={48}
      dy={6}
      padding={kind === "bar" ? { left: 8, right: 8 } : undefined}
    />
  );
  const yAxis = (
    <YAxis
      tickFormatter={axisFormat ?? format}
      tick={{ ...AXIS_TICK, className: "tabular-nums" }}
      axisLine={false}
      tickLine={false}
      width={56}
      domain={domain ?? (kind === "bar" ? [0, "auto"] : ["auto", "auto"])}
      tickCount={4}
      ticks={yTicks}
    />
  );
  const tooltip = (
    <Tooltip
      content={
        hideTooltip ? (
          () => null
        ) : (
          <ChartTooltip
            format={format}
            title={tooltipTitle}
            layers={inner?.layers}
          />
        )
      }
      cursor={
        kind === "area"
          ? {
              stroke: "var(--muted-foreground)",
              strokeWidth: 1,
              strokeDasharray: "0",
            }
          : { fill: "var(--hover)" }
      }
      isAnimationActive={false}
    />
  );
  const ref = reference && reference.value > 0 && (
    <ReferenceLine
      y={reference.value}
      stroke="var(--muted-foreground)"
      strokeOpacity={0.6}
      strokeDasharray="3 3"
      label={{
        value: reference.label,
        position:
          reference.side === "left" ? "insideTopLeft" : "insideTopRight",
        fill: "var(--muted-foreground)",
        fontSize: 10,
      }}
    />
  );

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="w-full select-none"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {kind === "area" ? (
          <AreaChart {...common}>
            <defs>
              <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.16} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {onActive && <ActiveReporter onActive={onActive} />}
            {ref}
            <Area
              type="monotone"
              dataKey="value"
              // With an inner series, this one is the quiet outline around it.
              stroke={inner ? "var(--muted-foreground)" : color}
              strokeWidth={inner ? 1.5 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill={inner ? "var(--foreground)" : `url(#fill-${id})`}
              fillOpacity={inner ? 0.04 : 1}
              activeDot={{
                r: 4,
                fill: inner ? "var(--muted-foreground)" : color,
                stroke: "var(--surface)",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
            {inner ? (
              <Area
                type="monotone"
                dataKey="inner"
                stroke={inner.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill={inner.color}
                fillOpacity={0.18}
                activeDot={{
                  r: 4,
                  fill: inner.color,
                  stroke: "var(--surface)",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            ) : null}
            {projection?.length ? (
              <Area
                type="linear"
                dataKey="projected"
                // Grey, not the series colour: an estimate, not a record.
                stroke="var(--muted-foreground)"
                strokeWidth={2}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                fill="none"
                activeDot={{
                  r: 4,
                  fill: "var(--muted-foreground)",
                  stroke: "var(--surface)",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            ) : null}
          </AreaChart>
        ) : (
          <BarChart {...common} barCategoryGap={2}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {onActive && <ActiveReporter onActive={onActive} />}
            {ref}
            <Bar
              dataKey="value"
              fill={color}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Tiny trend line for table cells and tiles. No axes, no interaction.
 * `fluid` stretches it to its container's width.
 */
export function Sparkline({
  values,
  color = "var(--muted-foreground)",
  width = 72,
  height = 22,
  fluid = false,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  fluid?: boolean;
}) {
  if (values.length < 2)
    return (
      <span
        style={{ width: fluid ? "100%" : width, height }}
        className="inline-block"
      />
    );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - 2) + 1;
      const y = height - 1 - ((v - min) / span) * (height - 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={fluid ? "100%" : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={fluid ? "none" : undefined}
      aria-hidden="true"
      className="block overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
