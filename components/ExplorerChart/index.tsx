import { ExplorerTooltip } from "@components/ExplorerTooltip";
import dayjs from "@lib/dayjs";
import { Box, Button, Flex, Skeleton, Text } from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import {
  formatETH,
  formatNumber,
  formatPercent,
  formatUSD,
} from "@utils/numberFormatters";
import numbro from "numbro";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart as ReBarChart,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

// Correctly formatted custom content of tooltip is required to not throw error in console
// As defined in https://recharts.github.io/en-US/examples/CustomContentOfTooltip
const CustomContentOfTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: unknown[];
}) => {
  const isVisible = active && payload && payload.length;
  return (
    <div
      className="custom-tooltip"
      style={{ visibility: isVisible ? "visible" : "hidden" }}
    />
  );
};

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

export type Group = "day" | "week" | "year" | "all";

const ExplorerChart = ({
  title,
  tooltip,
  data,
  base,
  basePercentChange,
  unit = "none",
  type,
  grouping = "day",
  onToggleGrouping,
}: {
  title: string;
  tooltip: string;
  base: number;
  basePercentChange: number;
  data: ChartDatum[];
  unit:
    | "usd"
    | "eth"
    | "minutes"
    | "percent"
    | "small-percent"
    | "small-unitless"
    | "none";
  type: "bar" | "line";
  grouping?: Group;
  onToggleGrouping?: (grouping: Group) => void;
}) => {
  const formatDateSubtitle = useCallback(
    (date: number) =>
      grouping === "day"
        ? `${dayjs.unix(date).format("MMM D")}`
        : `${dayjs
            .unix(date)
            .add(1, "day")
            .startOf("week")
            .format("MMM D")} - ${dayjs
            .unix(date)
            .add(1, "day")
            .endOf("week")
            .format("MMM D")}`,
    [grouping]
  );

  const formatSubtitle = useCallback(
    (value: number) => {
      switch (unit) {
        case "usd":
          return formatUSD(value, { precision: 0 });
        case "eth":
          return formatETH(value, { precision: 1 });
        case "percent":
          return formatPercent(value, { precision: 1 });
        case "small-percent":
          return formatPercent(value, { precision: 5 });
        case "minutes":
          return (
            formatNumber(value, { precision: 0, abbreviate: true }) + " minutes"
          );
        case "small-unitless":
          return formatNumber(value, { precision: 1, abbreviate: true });
        default:
          return formatNumber(value, { precision: 0, abbreviate: true });
      }
    },
    [unit]
  );

  const defaultSubtitle = useMemo<string>(
    () => formatSubtitle(base),
    [base, formatSubtitle]
  );
  const defaultPercentChange = useMemo<string>(
    () =>
      basePercentChange !== 0
        ? formatPercent(basePercentChange / 100, {
            precision: 2,
            forceSign: true,
          })
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

  useEffect(() => {
    setBarSelected((prev) => ({ ...prev, amount: defaultSubtitle }));
  }, [defaultSubtitle]);

  useEffect(() => {
    setBarSelected((prev) => ({
      ...prev,
      percentChange: defaultPercentChange,
    }));
  }, [defaultPercentChange]);

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
          {(() => {
            switch (unit) {
              case "usd":
                return formatUSD(payload.value, {
                  precision: 0,
                  abbreviate: true,
                });
              case "eth":
                return formatNumber(payload.value, { precision: 1 }) + " Ξ";
              case "percent":
                return formatPercent(payload.value, { precision: 0 });
              case "small-percent":
                return formatPercent(payload.value, { precision: 2 });
              case "small-unitless":
                return formatNumber(payload.value, {
                  precision: 1,
                  abbreviate: true,
                });
              default:
                return formatNumber(payload.value, {
                  precision: 0,
                  abbreviate: true,
                });
            }
          })()}
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
        : unit === "usd"
        ? 36
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
        <ExplorerTooltip
          multiline
          side="bottom"
          content={
            tooltip ? (
              <>
                <div>{tooltip}</div>
                <br />
                <div>
                  {`The estimation methodology was updated on 8/21/23. `}
                  <a href="https://forum.livepeer.org/t/livepeer-explorer-minutes-estimation-methodology/2140">
                    Read more about the changes
                  </a>
                  {"."}
                </div>
              </>
            ) : (
              <></>
            )
          }
        >
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
              <Box css={{ marginLeft: "$1" }}>
                <Box
                  as={QuestionMarkCircledIcon}
                  css={{ color: "$neutral11" }}
                />
              </Box>
            )}
          </Flex>
        </ExplorerTooltip>
        <Flex>
          {(data?.length || 0) <= 0 ? (
            <Skeleton css={{ marginTop: "$1", width: "100%", height: 20 }} />
          ) : (
            <>
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
                    marginLeft: "$2",
                    fontSize: "$3",
                    color:
                      (numbro(barSelected.percentChange).value() ?? 0) < 0
                        ? "#ff0022"
                        : "#00EB88",
                  }}
                >
                  {barSelected.percentChange}
                </Text>
              )}
            </>
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
      {type === "bar" && (
        <Flex
          css={{
            position: "absolute",
            right: 0,
            zIndex: 3,
          }}
        >
          <Button
            onClick={() => onToggleGrouping?.("day")}
            size="1"
            variant={grouping === "day" ? "primary" : "neutral"}
          >
            D
          </Button>
          <Button
            onClick={() => onToggleGrouping?.("week")}
            size="1"
            variant={grouping === "week" ? "primary" : "neutral"}
            css={{ marginLeft: "$1" }}
          >
            W
          </Button>
        </Flex>
      )}
      {type === "line" && grouping && onToggleGrouping && (
        <Flex
          css={{
            position: "absolute",
            right: 0,
            zIndex: 3,
          }}
        >
          <Button
            onClick={() => onToggleGrouping("year")}
            size="1"
            variant={grouping === "year" ? "primary" : "neutral"}
          >
            Y
          </Button>
          <Button
            onClick={() => onToggleGrouping("all")}
            size="1"
            variant={grouping === "all" ? "primary" : "neutral"}
            css={{ marginLeft: "$1" }}
          >
            All
          </Button>
        </Flex>
      )}
      <Box
        css={{
          paddingTop: 57,
          width: "100%",
          height: "100%",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {(data?.length || 0) <= 0 ? (
            <Skeleton css={{ width: "100%", height: "100%" }} />
          ) : type === "bar" ? (
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
              <ReTooltip content={CustomContentOfTooltip} />

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
                domain={["auto", "auto"]}
              />
              <ReTooltip content={CustomContentOfTooltip} />

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
