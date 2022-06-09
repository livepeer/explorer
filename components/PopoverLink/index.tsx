import { Box, Link as A } from "@livepeer/design-system";
import { ChevronRightIcon } from "@modulz/radix-icons";
import Link from "next/link";

const PopoverLink = ({ href, children }) => {
  return (
    <Link href={href} passHref>
      <A
        css={{
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
        }}
      >
        {children}
        <Box as={ChevronRightIcon} css={{ width: 16, height: 16 }} />
      </A>
    </Link>
  );
};

export default PopoverLink;
