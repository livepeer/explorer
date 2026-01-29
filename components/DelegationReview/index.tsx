import { Box, Flex, Text } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

const DelegationReview = ({ warnings }: { warnings: string[] }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <Box css={{ marginBottom: "$3" }}>
      {warnings.map((warning, i) => (
        <Flex
          key={i}
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
          <ExclamationTriangleIcon />
          <Text css={{ color: "inherit", fontSize: "inherit" }}>{warning}</Text>
        </Flex>
      ))}
    </Box>
  );
};

export default DelegationReview;
