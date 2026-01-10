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
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { ReactNode } from "react";
import {
  Column,
  HeaderGroup,
  Row,
  TableInstance,
  usePagination,
  UsePaginationInstanceProps,
  useSortBy,
  UseSortByInstanceProps,
  useTable,
} from "react-table";

import { PaginationControls } from "./PaginationControls";

function DataTable<T extends object>({
  heading = null,
  input = null,
  data,
  columns,
  initialState = {},
  renderCard,
}: {
  heading?: ReactNode;
  input?: ReactNode;
  data: T[];
  columns: Column<T>[];
  initialState: object;
  renderCard?: (row: Row<T>, index: number, pageIndex: number) => ReactNode;
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
  } = useTable<T>(
    {
      columns: columns || [],
      data,
      initialState,
    },
    useSortBy,
    usePagination
  ) as TableInstance<T> &
    UsePaginationInstanceProps<T> &
    UseSortByInstanceProps<T> & { state: { pageIndex: number } };

  // Card view (if renderCard is provided)
  if (renderCard) {
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
            padding: "$4",
            maxWidth: "100%",
            overflowX: "hidden",
          }}
        >
          {input && (
            <Box
              css={{
                marginBottom: "$4",
              }}
            >
              {input}
            </Box>
          )}
          <Box
            css={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "$3",
              minWidth: 0,
            }}
          >
            {page.map((row, index) => (
              <Box
                key={row.id || index}
                css={{ minWidth: 0, maxWidth: "100%" }}
              >
                {renderCard(row, index, pageIndex)}
              </Box>
            ))}
          </Box>
          <PaginationControls
            canPreviousPage={canPreviousPage}
            canNextPage={canNextPage}
            pageIndex={pageIndex}
            pageCount={pageCount}
            previousPage={previousPage}
            nextPage={nextPage}
          />
        </Box>
      </>
    );
  }

  // Table view (default)
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
              overflowY: "auto",
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
                      {headerGroup.headers.map((column, i) => {
                        const columnProps = column.getHeaderProps(
                          (
                            column as HeaderGroup<T> & {
                              getSortByToggleProps: (args?: {
                                title?: string;
                              }) => object;
                            }
                          ).getSortByToggleProps({
                            title: undefined,
                          })
                        );
                        const { key: columnKey, ...restColumnProps } =
                          columnProps;

                        return (
                          <Th
                            key={columnKey}
                            {...restColumnProps}
                            css={{
                              paddingLeft: i === 0 ? "$2" : "auto",
                              paddingRight: i === 0 ? "$2" : "auto",
                              width: i === 0 ? "40px" : "auto",
                              "@bp1": {
                                paddingLeft: i === 0 ? "$5" : "auto",
                                paddingRight: i === 0 ? "$5" : "auto",
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
                              {(
                                column as HeaderGroup<T> & {
                                  sortIconAlignment?: "start";
                                }
                              )?.sortIconAlignment !== "start" &&
                                column.render("Header")}
                              <Box
                                css={{
                                  minWidth:
                                    (
                                      column as HeaderGroup<T> & {
                                        sortIconAlignment?: "start";
                                      }
                                    )?.sortIconAlignment !== "start"
                                      ? 20
                                      : 0,
                                }}
                              >
                                {(
                                  column as HeaderGroup<T> & {
                                    isSorted: boolean;
                                  }
                                ).isSorted ? (
                                  (
                                    column as HeaderGroup<T> & {
                                      isSortedDesc: boolean;
                                    }
                                  ).isSortedDesc ? (
                                    <ChevronDownIcon />
                                  ) : (
                                    <ChevronUpIcon />
                                  )
                                ) : (
                                  <></>
                                )}
                              </Box>

                              {(
                                column as HeaderGroup<T> & {
                                  sortIconAlignment?: "start";
                                }
                              )?.sortIconAlignment === "start" && (
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
                              paddingLeft: i === 0 ? "$5" : "$1",
                              paddingRight: i === 0 ? "$5" : "$1",
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
          <PaginationControls
            canPreviousPage={canPreviousPage}
            canNextPage={canNextPage}
            pageIndex={pageIndex}
            pageCount={pageCount}
            previousPage={previousPage}
            nextPage={nextPage}
          />
        </>
      </Box>
    </>
  );
}

export default DataTable;
