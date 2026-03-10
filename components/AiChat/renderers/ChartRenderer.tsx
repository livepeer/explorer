import { Box, Text } from "@livepeer/design-system";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartResult = {
  type: "chart";
  title: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
};

export default function ChartRenderer({ data }: { data: ChartResult }) {
  return (
    <Box
      css={{
        borderRadius: "$3",
        border: "1px solid $neutral6",
        overflow: "hidden",
        marginTop: "$2",
        marginBottom: "$2",
      }}
    >
      <Box
        css={{
          padding: "$2 $3",
          backgroundColor: "$neutral3",
          borderBottom: "1px solid $neutral6",
        }}
      >
        <Text size="2" css={{ fontWeight: 600 }}>
          {data.title}
        </Text>
      </Box>
      <Box css={{ padding: "$3", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey={data.xKey}
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} width={60} />
            <Tooltip />
            <Bar dataKey={data.yKey} fill="var(--colors-primary9, #00a55f)" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
