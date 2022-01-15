import { useTable, useSortBy, usePagination } from "react-table";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@modulz/radix-icons";
import {
  Box,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@livepeer/design-system";

const OrchestratorPayoutsTable = ({
  pageSize = 10,
  columns,
  data: { tickets },
}) => {
  const tableOptions: any = {
    columns,
    data: tickets,
    disableSortRemove: true,
    autoResetPage: false,
    initialState: {
      pageSize,
      sortBy: [{ id: "timestamp", desc: true }],
      hiddenColumns: ["transaction", "faceValueUSD"],
    },
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    canPreviousPage,
    canNextPage,
    pageCount,
    nextPage,
    previousPage,
    state: { pageIndex },
  }: any = useTable(tableOptions, useSortBy, usePagination);

  return (
    <>
      <Box
        css={{
          overflowY: "scroll",
          backgroundImage: `linear-gradient(to right, var(--colors-loContrast), var(--colors-loContrast)), linear-gradient(to right, var(--colors-loContrast), var(--colors-loContrast)), linear-gradient(to right, rgba(0, 0, 20, .05), rgba(255, 255, 255, 0)), linear-gradient(to left, rgba(0, 0, 20, .05), rgba(255, 255, 255, 0))`,
          /* Shadows */
          /* Shadow covers */
          backgroundPosition:
            "left center, right center, left center, right center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "20px 100%, 20px 100%, 10px 100%, 10px 100%",
          backgroundAttachment: "local, local, scroll, scroll",
        }}
      >
        <Table
          {...getTableProps()}
          css={{
            backgroundColor: "$panel",
            borderCollapse: "collapse",
            tableLayout: "auto",
          }}
        >
          <Thead>
            {headerGroups.map((headerGroup, i) => (
              <Tr key={i} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, i) => (
                  <Th
                    key={i}
                    {...column.getHeaderProps(
                      column.getSortByToggleProps({ title: undefined })
                    )}
                    css={{
                      px: i === 0 ? "$5" : 0,
                    }}
                  >
                    <Box
                      css={{
                        fontSize: 11,
                        color: "$neutral10",
                        display: "flex",
                        alignItems: "center",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      {column.render("Header")}
                      <Box css={{ minWidth: 20 }}>
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <ChevronDownIcon />
                          ) : (
                            <ChevronUpIcon />
                          )
                        ) : (
                          ""
                        )}
                      </Box>
                    </Box>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody {...getTableBodyProps()}>
            {rows.map((row, i) => {
              prepareRow(row);
              return (
                <Tr key={i} {...row.getRowProps()}>
                  {row.cells.map((cell, i) => {
                    return (
                      <Td
                        key={i}
                        {...cell.getCellProps()}
                        css={{
                          px: i === 0 ? "$5" : "$1",
                        }}
                      >
                        {cell.render("Cell")}
                      </Td>
                    );
                  })}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
      <Flex
        css={{
          py: "$4",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          as={ArrowLeftIcon}
          css={{
            cursor: "pointer",
            color: canPreviousPage ? "$primary" : "text",
            opacity: canPreviousPage ? 1 : 0.5,
          }}
          onClick={() => {
            if (canPreviousPage) {
              previousPage();
            }
          }}
        />
        <Box css={{ fontSize: "$2", mx: "$3" }}>
          Page{" "}
          <Box as="span" css={{ fontFamily: "$monospace" }}>
            {pageIndex + 1}
          </Box>{" "}
          of{" "}
          <Box as="span" css={{ fontFamily: "$monospace" }}>
            {pageCount}
          </Box>
        </Box>
        <Box
          as={ArrowRightIcon}
          css={{
            cursor: "pointer",
            color: canNextPage ? "$primary" : "$text",
            opacity: canNextPage ? 1 : 0.5,
          }}
          onClick={() => {
            if (canNextPage) {
              nextPage();
            }
          }}
        />
      </Flex>
    </>
  );
};

export default OrchestratorPayoutsTable;
