import { Box, Link as A } from "@livepeer/design-system";
import { ChevronRightIcon } from "@modulz/radix-icons";
import Link from "next/link";

const PopoverLink = ({ href, children, newWindow = false }) => {
  return (
    <A
      {...(newWindow
        ? {
            target: "_blank",
            rel: "noopener noreferrer",
          }
        : {})}
      css={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        textDecoration: "none",
        borderRadius: "$2",
        cursor: "pointer",
        marginBottom: "$1",
        paddingLeft: "$3",
        paddingRight: "$3",
        paddingTop: "$1",
        paddingBottom: "$1",
        transition: ".2s transform",
        "&:last-child": {
          marginBottom: 0,
        },
        svg: {
          transition: ".2s transform",
          transform: "translateX(0px)",
        },
        "&:hover": {
          backgroundColor: "$neutral6",
          svg: {
            transition: ".2s transform",
            transform: "translateX(6px)",
          },
        },
      }}
      as={Link}
      href={href}
    >
      {children}
      <Box as={ChevronRightIcon} css={{ marginLeft: "$2", width: 16, height: 16 }} />
    </A>
  );
};

export default PopoverLink;
