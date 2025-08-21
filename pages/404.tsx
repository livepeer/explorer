import LivepeerLogo from "@components/Logo";
import { Box, Flex } from "@livepeer/design-system";

function Error() {
  return (
    <Flex
      css={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "$loContrast",
        height: "90vh",
        flexDirection: "column",
        paddingLeft: "$2",
        paddingRight: "$2"
      }}
    >
      <Box>
        <LivepeerLogo isDark />
      </Box>
      <Box
        css={{
          fontSize: 48,
          fontWeight: "700",
          maxWidth: 520,
          textAlign: "center",
        }}
      >
        Wait! This page encountered an error.
      </Box>
      <Box
        css={{
          marginTop: "$8",
          maxWidth: 520,
          textAlign: "center",
          color: "$neutral11",
        }}
      >
        {
          "We are actively working on a fix. Please check back soon."
        }
      </Box>
    </Flex>
  );
}

export default Error;
