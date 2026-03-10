import { Box, Text } from "@livepeer/design-system";
import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";

export default function MessageThread({
  messages,
  isLoading,
}: {
  messages: UIMessage[];
  isLoading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <Box
      ref={scrollRef}
      css={{
        flex: 1,
        overflowY: "auto",
        padding: "$3",
        display: "flex",
        flexDirection: "column",
        gap: "$1",
      }}
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && (
          <Box
            css={{
              padding: "$2 $3",
              borderRadius: "$3",
              backgroundColor: "$neutral3",
              border: "1px solid $neutral6",
              alignSelf: "flex-start",
            }}
          >
            <Text variant="neutral" size="2">
              Thinking...
            </Text>
          </Box>
        )}
    </Box>
  );
}
