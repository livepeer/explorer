import { Box, Text } from "@livepeer/design-system";

type TableResult = {
  type: "table";
  title: string;
  columns: string[];
  rows: (string | number)[][];
};

function formatCell(value: string | number): string {
  const str = String(value);
  // Truncate long addresses
  if (/^0x[a-fA-F0-9]{40}$/.test(str)) {
    return `${str.slice(0, 6)}...${str.slice(-4)}`;
  }
  return str;
}

export default function TableRenderer({ data }: { data: TableResult }) {
  return (
    <Box
      css={{
        borderRadius: "$3",
        border: "1px solid $neutral6",
        overflow: "hidden",
        marginTop: "$2",
        marginBottom: "$2",
      }}
    >
      <Box
        css={{
          padding: "$2 $3",
          backgroundColor: "$neutral3",
          borderBottom: "1px solid $neutral6",
        }}
      >
        <Text size="2" css={{ fontWeight: 600 }}>
          {data.title}
        </Text>
      </Box>
      <Box css={{ overflowX: "auto" }}>
        <Box
          as="table"
          css={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "$1",
          }}
        >
          <Box as="thead">
            <Box as="tr" css={{ backgroundColor: "$neutral2" }}>
              {data.columns.map((col) => (
                <Box
                  as="th"
                  key={col}
                  css={{
                    padding: "$1 $2",
                    textAlign: "left",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid $neutral6",
                  }}
                >
                  {col}
                </Box>
              ))}
            </Box>
          </Box>
          <Box as="tbody">
            {data.rows.map((row, i) => (
              <Box
                as="tr"
                key={i}
                css={{
                  "&:hover": { backgroundColor: "$neutral2" },
                }}
              >
                {row.map((cell, j) => (
                  <Box
                    as="td"
                    key={j}
                    css={{
                      padding: "$1 $2",
                      whiteSpace: "nowrap",
                      borderBottom: "1px solid $neutral4",
                      fontFamily: "$mono",
                    }}
                  >
                    {formatCell(cell)}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
