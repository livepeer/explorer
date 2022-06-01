import { Box, Flex, Text, Tooltip } from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import dayjs from "dayjs";
import numeral from "numeral";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart as ReBarChart,
  Cell,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Margin } from "recharts/types/util/types";

export type ChartDatum = { x: number; y: number };

const CustomizedXAxisTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={14}
        textAnchor="end"
        fill="white"
        fontWeight={400}
        fontSize="13px"
      >
        {dayjs.unix(payload.value).format("MMM YY")}
      </text>
    </g>
  );
};

const ExplorerChart = ({
  title,
  tooltip,
  data,
  base,
  basePercentChange,
  unit = "none",
  type,
  grouping = "day",
}: {
  title: string;
  tooltip: string;
  base: number;
  basePercentChange: number;
  data: ChartDatum[];
  unit: "usd" | "eth" | "minutes" | "percent" | "small-percent" | "none";
  type: "bar" | "line";
  grouping?: "day" | "week";
}) => {
  const formatDateSubtitle = useCallback(
    (date: number) =>
      grouping === "day"
        ? `${dayjs.unix(date).format("MMM D")}`
        : `${dayjs.unix(date).startOf("week").format("MMM D")} - ${dayjs
            .unix(date)
            .endOf("week")
            .format("MMM D")}`,
    [grouping]
  );
  const formatSubtitle = useCallback(
    (value: number) =>
      `${numeral(value).format(
        unit === "usd"
          ? "$0,0"
          : unit === "eth"
          ? "0,0.0"
          : unit === "percent"
          ? "0.0%"
          : unit === "small-percent"
          ? "0.0000%"
          : "0,0"
      )}${unit === "minutes" ? " minutes" : unit === "eth" ? " ETH" : ""}`,
    [unit]
  );
  const defaultSubtitle = useMemo<string>(
    () => formatSubtitle(base),
    [base, formatSubtitle]
  );
  const defaultPercentChange = useMemo<string>(
    () =>
      basePercentChange !== 0
        ? numeral(basePercentChange / 100).format("+0.00%")
        : "",
    [basePercentChange]
  );
  const [barSelected, setBarSelected] = useState<{
    amount: string;
    date: string | null;
    percentChange: string | null;
    activeIndex: number | null;
  }>({
    amount: defaultSubtitle,
    percentChange: defaultPercentChange,
    date: null,
    activeIndex: null,
  });

  const CustomizedYAxisTick = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dx={1}
          dy={0}
          textAnchor="start"
          fill="white"
          fontWeight={400}
          fontSize="13px"
        >
          {numeral(payload.value).format(
            unit === "usd"
              ? "$0a"
              : unit === "eth"
              ? "0.0"
              : unit === "percent"
              ? "0%"
              : unit === "small-percent"
              ? "0.00%"
              : "0a"
          )}
          {unit === "eth" ? " Ξ" : ""}
        </text>
      </g>
    );
  };

  const widthYAxis = useMemo(
    () =>
      unit === "small-percent"
        ? 45
        : unit === "percent"
        ? 35
        : unit === "minutes"
        ? 35
        : unit === "eth"
        ? 35
        : 30,
    [unit]
  );

  return (
    <Box css={{ position: "relative", width: "100%", height: "100%" }}>
      <Box
        css={{
          position: "absolute",
          zIndex: 3,
        }}
      >
        <Tooltip multiline content={tooltip ? <Box>{tooltip}</Box> : <></>}>
          <Flex
            css={{
              alignItems: "center",
            }}
          >
            <Text
              css={{
                fontWeight: 600,
                fontSize: "$2",
                color: "white",
              }}
            >
              {title}
            </Text>
            {tooltip && (
              <Box css={{ ml: "$1" }}>
                <QuestionMarkCircledIcon />
              </Box>
            )}
          </Flex>
        </Tooltip>
        <Flex>
          <Text
            css={{
              fontWeight: 600,
              fontSize: "$3",
              color: "white",
            }}
          >
            {barSelected.amount}
          </Text>
          {barSelected.percentChange && (
            <Text
              css={{
                ml: "$2",
                fontSize: "$3",
                color:
                  numeral(barSelected.percentChange).value() < 0
                    ? "#ff0022"
                    : "#00EB88",
              }}
            >
              {barSelected.percentChange}
            </Text>
          )}
        </Flex>
        <Text
          css={{
            fontWeight: 600,
            fontSize: "$2",
            color: "white",
          }}
        >
          {barSelected.date}
        </Text>
      </Box>
      <Box
        css={{
          pt: "$6",
          width: "100%",
          height: "100%",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <ReBarChart
              // syncId="chartId1"
              data={data}
              onMouseMove={(e) => {
                if (e?.activePayload?.[0]) {
                  setBarSelected({
                    amount: formatSubtitle(
                      Number(e?.activePayload?.[0]?.payload?.y)
                    ),
                    date: formatDateSubtitle(
                      Number(e?.activePayload?.[0]?.payload?.x)
                    ),
                    activeIndex: null,
                    percentChange: null,
                  });
                } else {
                  setBarSelected({
                    amount: defaultSubtitle,
                    date: null,
                    activeIndex: null,
                    percentChange: defaultPercentChange,
                  });
                }
              }}
              onMouseLeave={() =>
                setBarSelected({
                  amount: defaultSubtitle,
                  date: null,
                  activeIndex: null,
                  percentChange: defaultPercentChange,
                })
              }
            >
              <XAxis
                dataKey="x"
                tick={CustomizedXAxisTick}
                interval="preserveStartEnd"
              />
              <YAxis
                width={widthYAxis}
                orientation="right"
                tick={CustomizedYAxisTick}
              />
              <ReTooltip content={<></>} />

              <Bar dataKey="y" cursor="pointer" fill="rgba(0, 235, 136, 0.8)" />
            </ReBarChart>
          ) : (
            <ReLineChart
              // syncId="chartId1"
              data={data}
              onMouseMove={(e) => {
                if (e?.activePayload?.[0]) {
                  setBarSelected({
                    amount: formatSubtitle(
                      Number(e?.activePayload?.[0]?.payload?.y)
                    ),
                    date: formatDateSubtitle(
                      Number(e?.activePayload?.[0]?.payload?.x)
                    ),
                    activeIndex: null,
                    percentChange: null,
                  });
                } else {
                  setBarSelected({
                    amount: defaultSubtitle,
                    date: null,
                    activeIndex: null,
                    percentChange: defaultPercentChange,
                  });
                }
              }}
              onMouseLeave={() =>
                setBarSelected({
                  amount: defaultSubtitle,
                  date: null,
                  activeIndex: null,
                  percentChange: defaultPercentChange,
                })
              }
            >
              <XAxis
                dataKey="x"
                tick={CustomizedXAxisTick}
                interval="preserveStartEnd"
              />
              <YAxis
                width={widthYAxis}
                orientation="right"
                tick={CustomizedYAxisTick}
              />
              <ReTooltip content={<></>} />

              <Line
                dataKey="y"
                type="monotone"
                dot={{ r: 0, strokeWidth: 0 }}
                activeDot={{ r: 3, strokeWidth: 0 }}
                stroke="rgba(0, 235, 136, 0.8)"
                strokeWidth={2}
              />
            </ReLineChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default ExplorerChart;
