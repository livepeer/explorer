import { Box, Flex } from "@livepeer/design-system";

function Error() {
  return (
    <Flex
      css={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        bc: "$loContrast",
      }}
    >
      <Box
        css={{
          fontSize: "$5",
          pr: "$4",
          mr: "$4",
          borderRight: "1px solid",
          borderColor: "$hiContrast",
        }}
      >
        404
      </Box>
      <Box>This page could not be found</Box>
    </Flex>
  );
}

export default Error;
