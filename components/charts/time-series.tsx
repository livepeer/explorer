"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDate } from "@/lib/format";

export type Point = { ts: number; value: number; round?: number };

/** A chart row: an actual value, a projected one, or both where they meet. */
type Row = { ts: number; value?: number; projected?: number; round?: number };

const AXIS_TICK = { fill: "var(--subtle-foreground)", fontSize: 11 };

function ChartTooltip({
  active,
  payload,
  format,
  title,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  format: (v: number) => string;
  title?: (p: Point) => string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const projected = row.value == null;
  const p: Point = { ...row, value: row.value ?? row.projected ?? 0 };
  return (
    <div className="rounded-lg border border-hairline bg-popover px-3 py-2 shadow-(--shadow-popover)">
      <div className="text-[11px] text-muted-foreground">
        {projected && "Projected · "}
        {title
          ? title(p)
          : `${formatDate(p.ts, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}${p.round ? ` · Round ${p.round.toLocaleString()}` : ""}`}
      </div>
      <div className="mt-0.5 font-mono text-[13px] font-medium text-foreground tabular-nums">
        {format(p.value)}
      </div>
    </div>
  );
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
}: {
  data: Point[];
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
  const last = data[data.length - 1];
  const rows: Row[] =
    projection?.length && last
      ? [
          ...data.slice(0, -1),
          // The last actual point starts the projection, so the lines meet.
          { ...last, projected: last.value },
          ...projection.map((p) => ({ ts: p.ts, projected: p.value })),
        ]
      : data;
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
      content={<ChartTooltip format={format} title={tooltipTitle} />}
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
            {ref}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill={`url(#fill-${id})`}
              activeDot={{
                r: 4,
                fill: color,
                stroke: "var(--surface)",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
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
