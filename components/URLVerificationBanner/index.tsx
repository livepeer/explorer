import React from "react";
import { Flex, Box, Text } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

const URLVerificationBanner = () => {
  return (
    <Flex
      css={{
        paddingTop: "$2",
        paddingBottom: "$2",
        paddingLeft: "$3",
        paddingRight: "$3",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "$amber3",
        borderBottom: "1px solid $amber6",
        fontSize: "$2",
        gap: "$2",
        "@bp3": {
          fontSize: "$3",
        },
      }}
    >
      <Box
        as={ExclamationTriangleIcon}
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
          textAlign: "center",
        }}
      >
        Please make sure you are on explorer.livepeer.org - check the URL
        carefully.
      </Text>
    </Flex>
  );
};

export default URLVerificationBanner;
