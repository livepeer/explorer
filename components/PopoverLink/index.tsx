import { Box, Link as LivepeerLink } from "@jjasonn.stone/design-system";
import { ChevronRightIcon } from "@modulz/radix-icons";
import Link from "next/link";

const PopoverLink = ({ href, children, newWindow = false }) => {
  const linkStyles = {
    display: "flex",
    ai: "center",
    jc: "space-between",
    textDecoration: "none",
    borderRadius: "$2",
    cursor: "pointer",
    mb: "$1",
    px: "$3",
    py: "$1",
    transition: ".2s transform",
    "&:last-child": {
      mb: 0,
    },
    svg: {
      transition: ".2s transform",
      transform: "translateX(0px)",
    },
    "&:hover": {
      bc: "$neutral6",
      svg: {
        transition: ".2s transform",
        transform: "translateX(6px)",
      },
    },
  };

  return (
    <Link
      href={href}
      style={linkStyles}
      {...(newWindow
        ? {
            target: "_blank",
            rel: "noopener noreferrer",
          }
        : {})}
      legacyBehavior={false}
    >
      {children}
      <Box as={ChevronRightIcon} css={{ ml: "$2", width: 16, height: 16 }} />
    </Link>
  );
};

export default PopoverLink;
