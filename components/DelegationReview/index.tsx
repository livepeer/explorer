import { Box, Flex, Text } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

const DelegationReview = ({
  warning,
  css,
}: {
  warning?: string | null;
  css?: object;
}) => {
  if (!warning) return null;

  return (
    <Box css={{ marginBottom: "$3", ...css }}>
      <Flex
        css={{
          alignItems: "center",
          gap: "$2",
          color: "$yellow11",
          backgroundColor: "$yellow3",
          border: "1px solid $yellow7",
          borderRadius: "$2",
          padding: "$2",
          fontSize: "$2",
        }}
      >
        <ExclamationTriangleIcon width={28} height={28} />
        <Text css={{ color: "inherit", fontSize: "inherit" }}>{warning}</Text>
      </Flex>
    </Box>
  );
};

export default DelegationReview;
