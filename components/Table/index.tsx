import { useTable, useSortBy, usePagination } from "react-table";
import {
  Flex,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@livepeer/design-system";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";

function DataTable({
  heading = null,
  input = null,
  data,
  columns,
  initialState = {},
}) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageCount,
    nextPage,
    previousPage,
    state: { pageIndex },
  }: any = useTable(
    {
      columns,
      data,
      initialState,
    },
    useSortBy,
    usePagination
  );

  return (
    <>
      {heading && (
        <Flex align="center" css={{ jc: "space-between" }}>
          {heading}
        </Flex>
      )}
      <Box
        css={{
          border: "1px solid $colors$neutral4",
          backgroundColor: "$panel",
          borderRadius: "$4",
        }}
      >
        <>
          <Box
            css={{
              overflowY: "scroll",
            }}
          >
            {input && (
              <Box
                css={{
                  mt: "$4",
                  ml: "$5",
                }}
              >
                {input}
              </Box>
            )}
            <Table
              {...getTableProps()}
              css={{
                borderCollapse: "collapse",
                tableLayout: "auto",
                minWidth: 980,
                width: "100%",
                "@bp4": {
                  width: "100%",
                },
              }}
            >
              <Thead>
                {headerGroups.map((headerGroup, i) => (
                  <Tr key={i} {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column: any, i) => (
                      <Th
                        key={i}
                        {...column.getHeaderProps(
                          column.getSortByToggleProps({ title: undefined })
                        )}
                        css={{
                          px: i === 0 ? "$5" : 0,
                          width: i === 0 ? "40px" : "auto",
                        }}
                      >
                        <Box
                          css={{
                            fontSize: 11,
                            color: "$neutral10",
                            display: "flex",
                            pt: "$2",
                            alignItems: "center",
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}
                        >
                          {column?.sortIconAlignment !== "start" &&
                            column.render("Header")}
                          <Box
                            css={{
                              minWidth:
                                column?.sortIconAlignment !== "start" ? 20 : 0,
                            }}
                          >
                            {column.isSorted ? (
                              column.isSortedDesc ? (
                                <ChevronDownIcon />
                              ) : (
                                <ChevronUpIcon />
                              )
                            ) : (
                              <></>
                            )}
                          </Box>

                          {column?.sortIconAlignment === "start" && (
                            <Box
                              css={{
                                ml: "$1",
                              }}
                            >
                              {column.render("Header")}
                            </Box>
                          )}
                        </Box>
                      </Th>
                    ))}
                  </Tr>
                ))}
              </Thead>
              <Tbody {...getTableBodyProps()}>
                {page.map((row, i) => {
                  prepareRow(row);
                  return (
                    <Tr key={i} {...row.getRowProps()}>
                      {row.cells.map((cell, i) => {
                        return (
                          <Td
                            key={i}
                            {...cell.getCellProps()}
                            css={{
                              fontSize: "$3",
                              fontWeight: 500,
                              lineHeight: 2,
                              px: i === 0 ? "$5" : "$1",
                              width: i === 0 ? "40px" : "auto",
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
                color: canPreviousPage ? "$primary11" : "$hiContrast",
                opacity: canPreviousPage ? 1 : 0.5,
              }}
              onClick={() => {
                if (canPreviousPage) {
                  previousPage();
                }
              }}
            />
            <Box css={{ fontSize: "$2", mx: "$3" }}>
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
        </>
      </Box>
    </>
  );
}

export default DataTable;
