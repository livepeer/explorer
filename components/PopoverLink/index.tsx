import { Box, Link as A } from "@livepeer/design-system";
import { ChevronRightIcon } from "@modulz/radix-icons";
import Link from "next/link";

const PopoverLink = ({ href, children, newWindow = false }) => {
  const linkStyles = {
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
      bc: "$neutral6",
      svg: {
        transition: ".2s transform",
        transform: "translateX(6px)",
      },
    },
  };

  // For external links, use regular anchor tag to avoid Next.js Link issues
  if (newWindow || href.startsWith("http")) {
    return (
      <A href={href} target="_blank" rel="noopener noreferrer" css={linkStyles}>
        {children}
        <Box
          as={ChevronRightIcon}
          aria-hidden="true"
          css={{ marginLeft: "$2", width: 16, height: 16 }}
        />
      </A>
    );
  }

  // For internal links, use Next.js Link
  return (
    <A as={Link} href={href} passHref css={linkStyles}>
      {children}
      <Box
        as={ChevronRightIcon}
        aria-hidden="true"
        css={{ marginLeft: "$2", width: 16, height: 16 }}
      />
    </A>
  );
};

export default PopoverLink;
