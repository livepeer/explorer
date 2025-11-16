import React from "react";
import { Box, Flex, Text } from "@livepeer/design-system";
import { FiAlertTriangle, FiX } from "react-icons/fi";

type URLVerificationBannerProps = {
  onDismiss: () => void;
};

const URLVerificationBanner: React.FC<URLVerificationBannerProps> = ({
  onDismiss,
}) => {
  return (
    <Flex
      role="status"
      css={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "$amber3",
        borderBottom: "1px solid $amber6",
        fontSize: "$2",
        gap: "$2",
        px: "$3",
        py: "$2",
        position: "relative",
        textAlign: "center",
        pr: "$7",
        "@bp3": {
          fontSize: "$3",
        },
      }}
    >
      <Box
        as={FiAlertTriangle}
        aria-hidden="true"
        css={{
          color: "$amber11",
          width: 16,
          height: 16,
          flexShrink: 0,
        }}
      />
      <Text
        css={{
          color: "$amber11",
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        Please ensure you are on{" "}
        <Box as="span" css={{ fontWeight: 600 }}>
          explorer.livepeer.org
        </Box>{" "}
        — check the URL carefully.
      </Text>
      <Box
        as="button"
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss warning"
        css={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "none",
          padding: 4,
          color: "$amber11",
          position: "absolute",
          right: "$3",
          top: 12,
          width: 20,
          height: 20,
          transition: "opacity 150ms ease, transform 150ms ease",
          "&:hover": {
            opacity: 0.7,
            transform: "scale(1.1)",
          },
          "&:focus-visible": {
            outline: "2px solid $amber11",
            outlineOffset: 2,
          },
        }}
      >
        <FiX aria-hidden="true" />
      </Box>
    </Flex>
  );
};

export default URLVerificationBanner;
