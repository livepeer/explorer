import { ExplorerTooltip } from "@components/ExplorerTooltip";
import dayjs from "@lib/dayjs";
import { Box, Flex, Skeleton, Text } from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import { FiAlertTriangle } from "react-icons/fi";
import {
  OrderDirection,
  TranscoderUpdateEvent_OrderBy,
  useTranscoderUpdateEventsQuery,
} from "apollo";
import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

const MALICIOUS_THRESHOLD = 50;
const MIN_CHANGES_FOR_WARNING = 2;

type ChartDatum = {
  timestamp: number;
  rewardCut: number;
  feeCut: number;
};

// Matches ExplorerChart's hidden tooltip pattern to avoid console errors
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

// Matches ExplorerChart's CustomizedXAxisTick exactly
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

// Matches ExplorerChart's CustomizedYAxisTick style
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
        {payload.value}%
      </text>
    </g>
  );
};

export const Panel = ({ children }) => (
  <Flex
    css={{
      minHeight: 240,
      height: 240,
      padding: "24px",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      border: "0.5px solid $colors$neutral4",
      flex: 1,
      width: "100%",
      minWidth: 350,
    }}
  >
    {children}
  </Flex>
);

interface Props {
  transcoderId?: string;
}

const RewardCutHistory = ({ transcoderId }: Props) => {
  const { data, loading } = useTranscoderUpdateEventsQuery({
    variables: {
      where: {
        delegate: transcoderId,
      },
      first: 1000,
      orderBy: TranscoderUpdateEvent_OrderBy.Timestamp,
      orderDirection: OrderDirection.Asc,
    },
    skip: !transcoderId,
  });

  const chartData = useMemo<ChartDatum[]>(() => {
    if (!data?.transcoderUpdateEvents?.length) return [];
    const events = data.transcoderUpdateEvents.map((event) => ({
      timestamp: event.timestamp,
      rewardCut: (Number(event.rewardCut) / 1000000) * 100,
      feeCut: (1 - Number(event.feeShare) / 1000000) * 100,
    }));

    // Add a "now" anchor point with the most recent values so the chart
    // extends to the present day instead of ending at the last change
    const last = events[events.length - 1];
    const now = Math.floor(Date.now() / 1000);
    if (now - last.timestamp > 86400) {
      events.push({
        timestamp: now,
        rewardCut: last.rewardCut,
        feeCut: last.feeCut,
      });
    }

    return events;
  }, [data]);

  const warning = useMemo(() => {
    if (chartData.length < MIN_CHANGES_FOR_WARNING) return null;

    let maxRewardCutSwing = 0;
    let maxFeeCutSwing = 0;

    for (let i = 1; i < chartData.length; i++) {
      const rewardSwing = Math.abs(
        chartData[i].rewardCut - chartData[i - 1].rewardCut
      );
      const feeSwing = Math.abs(
        chartData[i].feeCut - chartData[i - 1].feeCut
      );
      maxRewardCutSwing = Math.max(maxRewardCutSwing, rewardSwing);
      maxFeeCutSwing = Math.max(maxFeeCutSwing, feeSwing);
    }

    if (
      maxRewardCutSwing >= MALICIOUS_THRESHOLD ||
      maxFeeCutSwing >= MALICIOUS_THRESHOLD
    ) {
      return "This orchestrator has a history of making large changes to their cut percentages. This may indicate a bait-and-switch strategy. Review the chart below before delegating.";
    }

    return null;
  }, [chartData]);

  const defaultValues = useMemo(() => {
    if (!chartData.length)
      return { rewardCut: "N/A", feeCut: "N/A" };
    const last = chartData[chartData.length - 1];
    return {
      rewardCut: `${last.rewardCut.toFixed(1)}%`,
      feeCut: `${last.feeCut.toFixed(1)}%`,
    };
  }, [chartData]);

  const [selected, setSelected] = useState<{
    rewardCut: string;
    feeCut: string;
    date: string | null;
  }>({
    rewardCut: defaultValues.rewardCut,
    feeCut: defaultValues.feeCut,
    date: null,
  });

  useEffect(() => {
    setSelected((prev) => ({
      ...prev,
      rewardCut: defaultValues.rewardCut,
      feeCut: defaultValues.feeCut,
    }));
  }, [defaultValues]);

  if (!transcoderId) return null;

  return (
    <Box>
      {/* Warning Banner - above the chart grid */}
      {warning && (
        <Flex
          role="alert"
          css={{
            alignItems: "center",
            backgroundColor: "$amber3",
            border: "1px solid $amber6",
            borderRadius: 10,
            padding: "$3",
            marginBottom: "$3",
            gap: "$2",
          }}
        >
          <Box
            as={FiAlertTriangle}
            aria-hidden="true"
            css={{
              color: "$amber11",
              flexShrink: 0,
              width: 16,
              height: 16,
            }}
          />
          <Text
            css={{
              fontSize: "$2",
              color: "$amber11",
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            {warning}
          </Text>
        </Flex>
      )}

      {/* Chart grid - matches homepage layout */}
      <Flex
        css={{
          backgroundColor: "$panel",
          borderRadius: "$4",
          border: "1px solid $colors$neutral4",
          overflow: "hidden",
          marginBottom: "$4",
        }}
      >
        <Box
          css={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr",
            "@bp2": {
              gridTemplateColumns: "1fr",
            },
          }}
        >
          <Panel>
            {/* Matches ExplorerChart's position: relative wrapper */}
            <Box
              css={{
                position: "relative",
                width: "100%",
                height: "100%",
              }}
            >
              {/* Header overlay - matches ExplorerChart's absolute header */}
              <Box css={{ position: "absolute", zIndex: 3 }}>
                <ExplorerTooltip
                  multiline
                  side="bottom"
                  content="Historical changes to the orchestrator's reward cut and fee cut over time. Large sudden changes may indicate malicious behavior."
                >
                  <Flex css={{ alignItems: "center" }}>
                    <Text
                      css={{
                        fontWeight: 600,
                        fontSize: "$2",
                        color: "white",
                      }}
                    >
                      Reward & Fee Cut History
                    </Text>
                    <Box css={{ marginLeft: "$1" }}>
                      <Box
                        as={QuestionMarkCircledIcon}
                        css={{ color: "$neutral11" }}
                      />
                    </Box>
                  </Flex>
                </ExplorerTooltip>
                <Flex>
                  {loading || (chartData?.length || 0) <= 0 ? (
                    <Skeleton
                      css={{ marginTop: "$1", width: "100%", height: 20 }}
                    />
                  ) : (
                    <Flex css={{ gap: "$3" }}>
                      <Flex css={{ alignItems: "center", gap: "$1" }}>
                        <Box
                          css={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "#ff6b6b",
                          }}
                        />
                        <Text
                          css={{
                            fontWeight: 600,
                            fontSize: "$3",
                            color: "white",
                          }}
                        >
                          {selected.rewardCut}
                        </Text>
                      </Flex>
                      <Flex css={{ alignItems: "center", gap: "$1" }}>
                        <Box
                          css={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "#4ecdc4",
                          }}
                        />
                        <Text
                          css={{
                            fontWeight: 600,
                            fontSize: "$3",
                            color: "white",
                          }}
                        >
                          {selected.feeCut}
                        </Text>
                      </Flex>
                    </Flex>
                  )}
                </Flex>
                <Text
                  css={{
                    fontWeight: 600,
                    fontSize: "$2",
                    color: "white",
                  }}
                >
                  {selected.date}
                </Text>
              </Box>

              {/* Chart area - matches ExplorerChart's paddingTop: 57 */}
              <Box css={{ paddingTop: 57, width: "100%", height: "100%" }}>
                {loading || (chartData?.length || 0) <= 0 ? (
                  <Skeleton css={{ width: "100%", height: "100%" }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      onMouseMove={(e) => {
                        if (e?.activePayload?.[0]) {
                          const d = e.activePayload[0].payload as ChartDatum;
                          setSelected({
                            rewardCut: `${d.rewardCut.toFixed(1)}%`,
                            feeCut: `${d.feeCut.toFixed(1)}%`,
                            date: dayjs.unix(d.timestamp).format("MMM D"),
                          });
                        } else {
                          setSelected({
                            rewardCut: defaultValues.rewardCut,
                            feeCut: defaultValues.feeCut,
                            date: null,
                          });
                        }
                      }}
                      onMouseLeave={() =>
                        setSelected({
                          rewardCut: defaultValues.rewardCut,
                          feeCut: defaultValues.feeCut,
                          date: null,
                        })
                      }
                    >
                      <XAxis
                        dataKey="timestamp"
                        tick={CustomizedXAxisTick}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        width={35}
                        orientation="right"
                        tick={CustomizedYAxisTick}
                        domain={[0, 100]}
                      />
                      <ReTooltip content={CustomContentOfTooltip} />
                      <Line
                        dataKey="rewardCut"
                        name="Reward Cut"
                        type="stepAfter"
                        dot={{ r: 0, strokeWidth: 0 }}
                        activeDot={{ r: 3, strokeWidth: 0 }}
                        stroke="#ff6b6b"
                        strokeWidth={2}
                      />
                      <Line
                        dataKey="feeCut"
                        name="Fee Cut"
                        type="stepAfter"
                        dot={{ r: 0, strokeWidth: 0 }}
                        activeDot={{ r: 3, strokeWidth: 0 }}
                        stroke="#4ecdc4"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Box>
          </Panel>
        </Box>
      </Flex>
    </Box>
  );
};

export default RewardCutHistory;
