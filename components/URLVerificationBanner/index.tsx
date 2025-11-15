import React, { useEffect, useState } from "react";
import { Flex, Box, Text } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { FiX } from "react-icons/fi";

// Unique ID for this banner - increment when changing banner content
const URL_VERIFICATION_BANNER_ID = 1;

const URLVerificationBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if banner has been dismissed before
    const ls = window.localStorage.getItem("bannersDismissed");
    const storage = ls ? JSON.parse(ls) : null;
    if (storage && storage.includes(URL_VERIFICATION_BANNER_ID)) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    const ls = window.localStorage.getItem("bannersDismissed");
    const storage = ls ? JSON.parse(ls) : null;
    if (storage) {
      storage.push(URL_VERIFICATION_BANNER_ID);
      window.localStorage.setItem(
        "bannersDismissed",
        JSON.stringify(storage)
      );
    } else {
      window.localStorage.setItem(
        "bannersDismissed",
        JSON.stringify([URL_VERIFICATION_BANNER_ID])
      );
    }
  };

  if (!isVisible) {
    return null;
  }

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
        position: "relative",
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
      <Box
        as={FiX}
        onClick={handleDismiss}
        css={{
          cursor: "pointer",
          position: "absolute",
          right: 20,
          color: "$amber11",
          width: 16,
          height: 16,
        }}
      />
    </Flex>
  );
};

export default URLVerificationBanner;
