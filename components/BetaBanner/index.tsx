import { Box, Flex, Link as A, Text } from "@livepeer/design-system";
import React from "react";
import { FiArrowRight, FiX } from "react-icons/fi";

export const BETA_URL = "https://beta.explorer.livepeer.org";

const DISMISSED_KEY = "betaBannerDismissed";

const isDismissed = () => {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
};

const BetaBanner = () => {
  // Hidden until mounted, so the server render matches and a dismissed
  // banner never flashes.
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(!isDismissed());
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === DISMISSED_KEY) {
        setOpen(!isDismissed());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const onDismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Storage blocked: hide it for this visit only.
    }
  };

  if (!open) return null;

  return (
    <Flex
      role="region"
      aria-label="New Explorer beta"
      css={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "$primary3",
        borderBottom: "1px solid $primary6",
        fontSize: "$2",
        gap: "$2",
        paddingLeft: "$4",
        paddingRight: "$7",
        paddingTop: "$2",
        paddingBottom: "$2",
        position: "relative",
        textAlign: "center",
        "@bp3": {
          fontSize: "$3",
        },
      }}
    >
      <Text css={{ color: "$primary11", fontWeight: 400, lineHeight: 1.4 }}>
        A new Explorer is in beta.{" "}
        <A
          href={BETA_URL}
          css={{
            color: "$primary11",
            fontWeight: 600,
            textDecoration: "underline",
            textDecorationColor: "$primary7",
            textUnderlineOffset: 3,
            whiteSpace: "nowrap",
            transition: "text-decoration-color 150ms ease",
            "& svg": { transition: "transform 150ms ease" },
            "&:hover": {
              color: "$primary11",
              textDecoration: "underline",
              textDecorationColor: "$primary11",
            },
            "&:hover svg": { transform: "translateX(2px)" },
          }}
        >
          Try it at beta.explorer.livepeer.org
          <Box
            as={FiArrowRight}
            aria-hidden="true"
            css={{
              display: "inline",
              marginLeft: "$1",
              verticalAlign: "-2px",
            }}
          />
        </A>
      </Text>
      <Box
        as="button"
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss beta announcement"
        css={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "none",
          padding: 4,
          color: "$primary11",
          position: "absolute",
          right: "$3",
          top: "50%",
          transform: "translateY(-50%)",
          width: 22,
          height: 22,
          fontSize: "18px",
          transition: "opacity 150ms ease",
          "&:hover": { opacity: 0.7 },
          "&:focus-visible": {
            outline: "2px solid $primary11",
            outlineOffset: 2,
          },
        }}
      >
        <FiX aria-hidden="true" />
      </Box>
    </Flex>
  );
};

export default BetaBanner;
