import { Box, Flex, Skeleton } from "@livepeer/design-system";

const OrchestratorListSkeleton = () => {
  return (
    <Box
      css={{
        border: "1px solid $colors$neutral4",
        backgroundColor: "$panel",
        borderRadius: "$4",
      }}
    >
      {/* Input section skeleton */}
      <Box
        css={{
          marginTop: "$4",
          marginLeft: "$5",
          marginBottom: "$4",
        }}
      >
        <Flex css={{ alignItems: "center", marginBottom: "$2" }}>
          <Skeleton css={{ width: 20, height: 20, borderRadius: "$2" }} />
          <Skeleton css={{ width: 200, height: 16, marginLeft: "$2" }} />
        </Flex>
        <Flex css={{ gap: "$2", marginBottom: "$2" }}>
          <Skeleton css={{ width: 120, height: 32, borderRadius: "$2" }} />
          <Skeleton css={{ width: 120, height: 32, borderRadius: "$2" }} />
          <Skeleton css={{ width: 120, height: 32, borderRadius: "$2" }} />
        </Flex>
      </Box>

      {/* Table header skeleton */}
      <Box
        css={{ padding: "$3 $5", borderBottom: "1px solid $colors$neutral4" }}
      >
        <Flex css={{ gap: "$4" }}>
          <Skeleton css={{ width: 150, height: 16 }} />
          <Skeleton css={{ width: 120, height: 16 }} />
          <Skeleton css={{ width: 120, height: 16 }} />
          <Skeleton css={{ width: 100, height: 16 }} />
          <Skeleton css={{ width: 100, height: 16 }} />
        </Flex>
      </Box>

      {/* Table rows skeleton (10 rows) */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Box
          key={i}
          css={{
            padding: "$3 $5",
            borderBottom: i < 9 ? "1px solid $colors$neutral4" : "none",
          }}
        >
          <Flex css={{ gap: "$4", alignItems: "center" }}>
            <Skeleton css={{ width: 150, height: 40, borderRadius: "$2" }} />
            <Skeleton css={{ width: 120, height: 20 }} />
            <Skeleton css={{ width: 120, height: 20 }} />
            <Skeleton css={{ width: 100, height: 20 }} />
            <Skeleton css={{ width: 100, height: 20 }} />
          </Flex>
        </Box>
      ))}

      {/* Pagination skeleton */}
      <Flex
        css={{
          paddingTop: "$4",
          paddingBottom: "$4",
          alignItems: "center",
          justifyContent: "center",
          gap: "$3",
        }}
      >
        <Skeleton css={{ width: 20, height: 20, borderRadius: "$2" }} />
        <Skeleton css={{ width: 100, height: 16 }} />
        <Skeleton css={{ width: 20, height: 20, borderRadius: "$2" }} />
      </Flex>
    </Box>
  );
};

export default OrchestratorListSkeleton;
