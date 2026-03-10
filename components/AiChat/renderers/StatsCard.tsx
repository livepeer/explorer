import { Box, Flex, Text } from "@livepeer/design-system";

type StatsResult = {
  type: "stats";
  title: string;
  stats: Record<string, string | number>;
};

export default function StatsCard({ data }: { data: StatsResult }) {
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
      <Box css={{ padding: "$3" }}>
        {Object.entries(data.stats).map(([key, value]) => (
          <Flex
            key={key}
            css={{
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "$1",
              paddingBottom: "$1",
              borderBottom: "1px solid $neutral4",
              "&:last-child": { borderBottom: "none" },
            }}
          >
            <Text variant="neutral" size="2">
              {key}
            </Text>
            <Text size="2" css={{ fontWeight: 500, fontFamily: "$mono" }}>
              {String(value)}
            </Text>
          </Flex>
        ))}
      </Box>
    </Box>
  );
}
