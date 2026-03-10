import { Box, Text } from "@livepeer/design-system";
import type { UIMessage } from "ai";

import ChartRenderer from "./renderers/ChartRenderer";
import StatsCard from "./renderers/StatsCard";
import TableRenderer from "./renderers/TableRenderer";

type ToolResult = {
  type: "table" | "stats" | "chart" | "error";
  title?: string;
  message?: string;
  [key: string]: unknown;
};

function ToolResultRenderer({ result }: { result: ToolResult }) {
  if (result.type === "error") {
    return (
      <Box
        css={{
          padding: "$2 $3",
          borderRadius: "$2",
          backgroundColor: "$red3",
          border: "1px solid $red6",
          marginTop: "$1",
        }}
      >
        <Text size="2" css={{ color: "$red11" }}>
          {result.message ?? "An error occurred"}
        </Text>
      </Box>
    );
  }

  if (result.type === "table") {
    return <TableRenderer data={result as never} />;
  }

  if (result.type === "stats") {
    return <StatsCard data={result as never} />;
  }

  if (result.type === "chart") {
    return <ChartRenderer data={result as never} />;
  }

  return null;
}

export default function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  // Extract text content from parts
  const textContent = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  // Extract tool invocations from parts
  const toolParts = message.parts.filter(
    (p) =>
      p.type.startsWith("tool-") || p.type === "dynamic-tool"
  );

  return (
    <Box
      css={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: "$2",
      }}
    >
      {textContent && (
        <Box
          css={{
            maxWidth: isUser ? "80%" : "100%",
            padding: "$2 $3",
            borderRadius: "$3",
            backgroundColor: isUser ? "$primary4" : "$neutral3",
            border: `1px solid ${isUser ? "$primary6" : "$neutral6"}`,
          }}
        >
          <Text
            size="2"
            css={{
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {textContent}
          </Text>
        </Box>
      )}
      {toolParts.map((part) => {
        const toolPart = part as {
          type: string;
          toolCallId: string;
          state: string;
          result?: unknown;
        };
        if (toolPart.state === "result" && toolPart.result) {
          return (
            <Box key={toolPart.toolCallId} css={{ width: "100%" }}>
              <ToolResultRenderer result={toolPart.result as ToolResult} />
            </Box>
          );
        }
        if (toolPart.state === "call" || toolPart.state === "partial-call") {
          return (
            <Box
              key={toolPart.toolCallId}
              css={{
                padding: "$2 $3",
                marginTop: "$1",
                borderRadius: "$2",
                backgroundColor: "$neutral2",
                border: "1px solid $neutral5",
              }}
            >
              <Text variant="neutral" size="1">
                Fetching data...
              </Text>
            </Box>
          );
        }
        return null;
      })}
    </Box>
  );
}
