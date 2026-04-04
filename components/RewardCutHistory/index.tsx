import { ExplorerTooltip } from "@components/ExplorerTooltip";
import dayjs from "@lib/dayjs";
import { Box, Card, Flex, Skeleton, Text } from "@livepeer/design-system";
import {
  ExclamationTriangleIcon,
  QuestionMarkCircledIcon,
} from "@modulz/radix-icons";
import {
  OrderDirection,
  TranscoderUpdateEvent_OrderBy,
  useTranscoderUpdateEventsQuery,
} from "apollo";
import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MALICIOUS_THRESHOLD = 50; // swing of 50+ percentage points is suspicious
const MIN_CHANGES_FOR_WARNING = 2; // need at least 2 changes to detect a pattern

type ChartDatum = {
  timestamp: number;
  rewardCut: number;
  feeCut: number;
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
}) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <Box
      css={{
        backgroundColor: "$neutral3",
        border: "1px solid $neutral6",
        borderRadius: "$2",
        padding: "$2",
      }}
    >
      <Text css={{ fontSize: "$1", color: "$neutral11", marginBottom: "$1" }}>
        {dayjs.unix(data.timestamp).format("MMM D, YYYY")}
      </Text>
      <Flex css={{ alignItems: "center", gap: "$1" }}>
        <Box
          css={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#ff6b6b",
          }}
        />
        <Text css={{ fontSize: "$2", color: "$hiContrast" }}>
          Reward Cut: {data.rewardCut.toFixed(1)}%
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
        <Text css={{ fontSize: "$2", color: "$hiContrast" }}>
          Fee Cut: {data.feeCut.toFixed(1)}%
        </Text>
      </Flex>
    </Box>
  );
};

const CustomXAxisTick = ({ x, y, payload }) => (
  <g transform={`translate(${x},${y})`}>
    <text
      x={0}
      y={0}
      dy={14}
      textAnchor="end"
      fill="white"
      fontWeight={400}
      fontSize="12px"
    >
      {dayjs.unix(payload.value).format("MMM YY")}
    </text>
  </g>
);

const CustomYAxisTick = ({ x, y, payload }) => (
  <g transform={`translate(${x},${y})`}>
    <text
      x={0}
      y={0}
      dx={1}
      dy={0}
      textAnchor="start"
      fill="white"
      fontWeight={400}
      fontSize="12px"
    >
      {payload.value}%
    </text>
  </g>
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
    if (!data?.transcoderUpdateEvents) return [];
    return data.transcoderUpdateEvents.map((event) => ({
      timestamp: event.timestamp,
      rewardCut: (Number(event.rewardCut) / 1000000) * 100, // 1000000 = 100%
      feeCut: (1 - Number(event.feeShare) / 1000000) * 100, // feeShare is inverse of feeCut
    }));
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
      return `This orchestrator has changed their ${
        maxRewardCutSwing >= MALICIOUS_THRESHOLD ? "reward cut" : "fee cut"
      } by ${Math.max(maxRewardCutSwing, maxFeeCutSwing).toFixed(0)}+ percentage points. Large swings may indicate a bait-and-switch strategy where delegators are attracted with low cuts that are later raised.`;
    }

    return null;
  }, [chartData]);

  const [hovered, setHovered] = useState<{
    rewardCut: string;
    feeCut: string;
    date: string | null;
  } | null>(null);

  const currentValues = useMemo(() => {
    if (!chartData.length)
      return { rewardCut: "N/A", feeCut: "N/A" };
    const last = chartData[chartData.length - 1];
    return {
      rewardCut: `${last.rewardCut.toFixed(1)}%`,
      feeCut: `${last.feeCut.toFixed(1)}%`,
    };
  }, [chartData]);

  if (!transcoderId) return null;

  return (
    <Card
      variant="active"
      css={{
        padding: "$3",
        boxShadow: "$colors$neutral5 0px 0px 0px 1px inset",
        marginTop: "$3",
      }}
    >
      {/* Header */}
      <Flex
        css={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "$2",
        }}
      >
        <Box>
          <Flex css={{ alignItems: "center" }}>
            <Text
              css={{
                fontSize: "$2",
                color: "$neutral9",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Reward & Fee Cut History
            </Text>
            <ExplorerTooltip
              multiline
              content="Historical changes to the orchestrator's reward cut and fee cut over time. Large sudden changes may indicate malicious behavior."
            >
              <Flex css={{ marginLeft: "$1" }}>
                <Box
                  as={QuestionMarkCircledIcon}
                  css={{ color: "$neutral11" }}
                />
              </Flex>
            </ExplorerTooltip>
          </Flex>
          <Flex css={{ gap: "$3", marginTop: "$1" }}>
            <Flex css={{ alignItems: "center", gap: "$1" }}>
              <Box
                css={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#ff6b6b",
                }}
              />
              <Text css={{ fontSize: "$2", color: "$hiContrast", fontWeight: 600 }}>
                Reward Cut:{" "}
                {hovered ? hovered.rewardCut : currentValues.rewardCut}
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
              <Text css={{ fontSize: "$2", color: "$hiContrast", fontWeight: 600 }}>
                Fee Cut: {hovered ? hovered.feeCut : currentValues.feeCut}
              </Text>
            </Flex>
          </Flex>
          {hovered?.date && (
            <Text css={{ fontSize: "$1", color: "$neutral11", marginTop: "$1" }}>
              {hovered.date}
            </Text>
          )}
        </Box>
      </Flex>

      {/* Warning Banner */}
      {warning && (
        <Flex
          css={{
            backgroundColor: "rgba(255, 107, 107, 0.1)",
            border: "1px solid rgba(255, 107, 107, 0.3)",
            borderRadius: "$2",
            padding: "$2",
            marginBottom: "$2",
            alignItems: "flex-start",
            gap: "$2",
          }}
        >
          <Box
            as={ExclamationTriangleIcon}
            css={{
              color: "#ff6b6b",
              flexShrink: 0,
              marginTop: 2,
              width: 16,
              height: 16,
            }}
          />
          <Text css={{ fontSize: "$2", color: "#ff6b6b", lineHeight: 1.4 }}>
            {warning}
          </Text>
        </Flex>
      )}

      {/* Chart */}
      <Box css={{ width: "100%", height: 200 }}>
        {loading || chartData.length === 0 ? (
          <Skeleton css={{ width: "100%", height: "100%", borderRadius: 8 }} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              onMouseMove={(e) => {
                if (e?.activePayload?.[0]) {
                  const d = e.activePayload[0].payload as ChartDatum;
                  setHovered({
                    rewardCut: `${d.rewardCut.toFixed(1)}%`,
                    feeCut: `${d.feeCut.toFixed(1)}%`,
                    date: dayjs.unix(d.timestamp).format("MMM D, YYYY"),
                  });
                }
              }}
              onMouseLeave={() => setHovered(null)}
            >
              <XAxis
                dataKey="timestamp"
                tick={CustomXAxisTick}
                interval="preserveStartEnd"
              />
              <YAxis
                width={35}
                orientation="right"
                tick={CustomYAxisTick}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                dataKey="rewardCut"
                name="Reward Cut"
                type="stepAfter"
                dot={{ r: 2, strokeWidth: 0, fill: "#ff6b6b" }}
                activeDot={{ r: 4, strokeWidth: 0 }}
                stroke="#ff6b6b"
                strokeWidth={2}
              />
              <Line
                dataKey="feeCut"
                name="Fee Cut"
                type="stepAfter"
                dot={{ r: 2, strokeWidth: 0, fill: "#4ecdc4" }}
                activeDot={{ r: 4, strokeWidth: 0 }}
                stroke="#4ecdc4"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Card>
  );
};

export default RewardCutHistory;
