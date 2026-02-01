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
        as={ArrowLeftIcon}
        css={{
          cursor: "pointer",
          color: canPrevious ? "$primary11" : "$hiContrast",
          opacity: canPrevious ? 1 : 0.5,
        }}
        onClick={() => {
          if (canPrevious) {
            onPrevious();
          }
        }}
      />
      <Box css={{ fontSize: "$2", marginLeft: "$3", marginRight: "$3" }}>
        Page <Box as="span">{currentPage}</Box> of{" "}
        <Box as="span">{totalPages}</Box>
      </Box>
      <Box
        as={ArrowRightIcon}
        css={{
          cursor: "pointer",
          color: canNext ? "$primary11" : "$hiContrast",
          opacity: canNext ? 1 : 0.5,
        }}
        onClick={() => {
          if (canNext) {
            onNext();
          }
        }}
      />
    </Flex>
  );
};

export default Pagination;
