import { Box, Flex } from "@livepeer/design-system";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";

type PaginationControlsProps = {
  canPreviousPage: boolean;
  canNextPage: boolean;
  pageIndex: number;
  pageCount: number;
  previousPage: () => void;
  nextPage: () => void;
};

export function PaginationControls({
  canPreviousPage,
  canNextPage,
  pageIndex,
  pageCount,
  previousPage,
  nextPage,
}: PaginationControlsProps) {
  return (
    <Flex
      css={{
        paddingTop: "$4",
        paddingBottom: "$4",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        as={ArrowLeftIcon}
        css={{
          cursor: "pointer",
          color: canPreviousPage ? "$primary11" : "$hiContrast",
          opacity: canPreviousPage ? 1 : 0.5,
        }}
        onClick={() => {
          if (canPreviousPage) {
            previousPage();
          }
        }}
      />
      <Box css={{ fontSize: "$2", marginLeft: "$3", marginRight: "$3" }}>
        Page <Box as="span">{pageIndex + 1}</Box> of{" "}
        <Box as="span">{pageCount}</Box>
      </Box>
      <Box
        as={ArrowRightIcon}
        css={{
          cursor: "pointer",
          color: canNextPage ? "$primary11" : "$hiContrast",
          opacity: canNextPage ? 1 : 0.5,
        }}
        onClick={() => {
          if (canNextPage) {
            nextPage();
          }
        }}
      />
    </Flex>
  );
}
