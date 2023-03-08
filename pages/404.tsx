import { Box, Flex } from "@livepeer/design-system";

function Error() {
  return (
    <Flex
      css={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        bc: "$loContrast",
        height: "100vh",
        alignContent: "center",
        justifyItems: "center"
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
      <Box>{"We've encountered an error on this page. We're working on a fix now!"}</Box>
    </Flex>
  );
}

export default Error;
