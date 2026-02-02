import { Box, Flex } from "@livepeer/design-system";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  css?: object;
};

const Pagination = ({
  currentPage,
  totalPages,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  css,
}: PaginationProps) => {
  if (totalPages <= 0) return null;

  return (
    <Flex
      css={{
        paddingTop: "$4",
        paddingBottom: "$4",
        alignItems: "center",
        justifyContent: "center",
        ...css,
      }}
    >
      <Box
        aria-label="Previous Page"
        as="button"
        type="button"
        css={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: canPrevious ? "$primary11" : "$hiContrast",
          opacity: canPrevious ? 1 : 0.5,
        }}
        onClick={() => {
          if (canPrevious) {
            onPrevious();
          }
        }}
      >
        <ArrowLeftIcon />
      </Box>
      <Box css={{ fontSize: "$2", marginLeft: "$3", marginRight: "$3" }}>
        Page <Box as="span">{currentPage}</Box> of{" "}
        <Box as="span">{totalPages}</Box>
      </Box>
      <Box
        aria-label="Next Page"
        as="button"
        type="button"
        css={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: canNext ? "$primary11" : "$hiContrast",
          opacity: canNext ? 1 : 0.5,
        }}
        onClick={() => {
          if (canNext) {
            onNext();
          }
        }}
      >
        <ArrowRightIcon />
      </Box>
    </Flex>
  );
};

export default Pagination;
