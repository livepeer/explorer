import {
  Box,
  Flex,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@livepeer/design-system";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import { ReactNode } from "react";
import { Column, usePagination, useSortBy, useTable } from "react-table";

function DataTable<T extends object>({
  heading = null,
  input = null,
  data,
  columns,
  initialState = {},
}: {
  heading?: ReactNode;
  input?: ReactNode;
  data: T[];
  columns: Column<T>[];
  initialState: object;
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
  }: any = useTable<T>(
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
        <Flex align="center" css={{ justifyContent: "space-between" }}>
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
                  marginTop: "$4",
                  marginLeft: "$5",
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
                {headerGroups.map((headerGroup) => {
                  const headerGroupProps = headerGroup.getHeaderGroupProps();
                  const { key: headerGroupKey, ...restHeaderGroupProps } =
                    headerGroupProps;

                  return (
                    <Tr key={headerGroupKey} {...restHeaderGroupProps}>
                      {headerGroup.headers.map((column: any, i) => {
                        const columnProps = column.getHeaderProps(
                          column.getSortByToggleProps({ title: undefined })
                        );
                        const { key: columnKey, ...restColumnProps } =
                          columnProps;

                        return (
                          <Th
                            key={columnKey}
                            {...restColumnProps}
                            css={{
                              px: i === 0 ? "$2" : "auto",
                              width: i === 0 ? "40px" : "auto",
                              "@bp1": {
                                px: i === 0 ? "$5" : "auto",
                              },
                            }}
                          >
                            <Box
                              css={{
                                fontSize: 11,
                                color: "$neutral10",
                                display: "flex",
                                paddingTop: "$2",
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
                                    column?.sortIconAlignment !== "start"
                                      ? 20
                                      : 0,
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
                                    marginLeft: "$1",
                                  }}
                                >
                                  {column.render("Header")}
                                </Box>
                              )}
                            </Box>
                          </Th>
                        );
                      })}
                    </Tr>
                  );
                })}
              </Thead>
              <Tbody {...getTableBodyProps()}>
                {page.map((row, i) => {
                  prepareRow(row);
                  return (
                    <Tr key={i}>
                      {row.cells.map((cell, i) => {
                        const cellProps = cell.getCellProps();
                        const { key: cellKey, ...restCellProps } = cellProps;

                        return (
                          <Td
                            key={cellKey}
                            {...restCellProps}
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
        </>
      </Box>
    </>
  );
}

export default DataTable;
