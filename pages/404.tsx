import LivepeerLogo from "@components/Logo";
import { Box, Flex } from "@jjasonn.stone/design-system";

function Error() {
  return (
    <Flex
      css={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        bc: "$loContrast",
        height: "90vh",
        flexDirection: "column",
        px: "$2"
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
          mt: "$8",
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
