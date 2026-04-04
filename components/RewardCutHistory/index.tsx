import { ExplorerTooltip } from "@components/ExplorerTooltip";
import dayjs from "@lib/dayjs";
import { Box, Flex, Skeleton, Text } from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import { useRewardCutHistory } from "hooks/useRewardCutHistory";
import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

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
      paddingRight: "32px",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      border: "0.5px solid $colors$neutral4",
      flex: 1,
      width: "100%",
      "@bp1": {
        minWidth: 350,
      },
    }}
  >
    {children}
  </Flex>
);

interface Props {
  transcoderId?: string;
}

const RewardCutHistory = ({ transcoderId }: Props) => {
  const { chartData, loading } = useRewardCutHistory(transcoderId);

  const defaultValues = useMemo(() => {
    if (!chartData.length) return { rewardCut: "N/A", feeCut: "N/A" };
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
      {/* Chart grid - matches homepage layout */}
      <Flex
        css={{
          backgroundColor: "$panel",
          borderRadius: "$4",
          border: "1px solid $colors$neutral4",
          overflow: "visible",
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
                          const d = e.activePayload[0].payload as {
                            timestamp: number;
                            rewardCut: number;
                            feeCut: number;
                          };
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
                        width={40}
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
