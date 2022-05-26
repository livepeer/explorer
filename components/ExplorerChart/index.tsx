import { Box, Flex, Text } from "@livepeer/design-system";
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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  data,
  base,
  basePercentChange,
  unit = "none",
  type,
}: {
  title: string;
  base: number;
  basePercentChange: number;
  data: ChartDatum[];
  unit: "usd" | "minutes" | "percent" | "none";
  type: "bar" | "line";
}) => {
  const formatDateSubtitle = useCallback(
    (date: number) =>
      `${dayjs.unix(date).startOf("week").format("MMM D")} - ${dayjs
        .unix(date)
        .endOf("week")
        .format("MMM D")}`,
    []
  );
  const formatSubtitle = useCallback(
    (value: number) =>
      `${numeral(value).format(
        unit === "usd" ? "$0,0" : unit === "percent" ? "0.0%" : "0,0"
      )}${unit === "minutes" ? " minutes" : ""}`,
    [unit]
  );
  const defaultSubtitle = useMemo<string>(
    () => formatSubtitle(base),
    [base, formatSubtitle]
  );
  const defaultPercentChange = useMemo<string>(
    () => numeral(basePercentChange / 100).format("+0.00%"),
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
            unit === "usd" ? "$0a" : unit === "percent" ? "0.0%" : "0a"
          )}
        </text>
      </g>
    );
  };

  return (
    <Box css={{ width: "100%", height: "100%" }}>
      <Box
        css={{
          position: "absolute",
          zIndex: 3,
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
                color: "#00EB88",
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
              syncId="chartId1"
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
                width={40}
                orientation="right"
                tick={CustomizedYAxisTick}
              />
              <Tooltip content={<></>} />

              <Bar dataKey="y" cursor="pointer" fill="rgba(0, 235, 136, 0.8)" />
            </ReBarChart>
          ) : (
            <ReLineChart
              syncId="chartId1"
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
                width={40}
                orientation="right"
                tick={CustomizedYAxisTick}
              />
              <Tooltip content={<></>} />

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
