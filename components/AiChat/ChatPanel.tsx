import { useChat } from "@ai-sdk/react";
import { Box, Flex, Text } from "@livepeer/design-system";
import { Cross2Icon } from "@modulz/radix-icons";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useState } from "react";

import ChatInput from "./ChatInput";
import MessageThread from "./MessageThread";
import SuggestedQuestions from "./SuggestedQuestions";

export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/chat" }),
    []
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  // Manage input state locally since v6 useChat doesn't provide it
  const [input, setInput] = useState("");

  const isLoading = status === "submitted" || status === "streaming";

  const onSelectSuggestion = useCallback(
    (question: string) => {
      sendMessage({ text: question });
    },
    [sendMessage]
  );

  const onSubmitInput = useCallback(() => {
    if (input.trim()) {
      sendMessage({ text: input.trim() });
      setInput("");
    }
  }, [input, sendMessage]);

  return (
    <Box
      css={{
        position: "fixed",
        bottom: 80,
        right: 20,
        width: 400,
        height: 600,
        maxHeight: "calc(100vh - 100px)",
        borderRadius: "$4",
        backgroundColor: "$loContrast",
        border: "1px solid $neutral6",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 1000,
        "@media (max-width: 480px)": {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          maxHeight: "100%",
          borderRadius: 0,
        },
      }}
    >
      {/* Header */}
      <Flex
        css={{
          padding: "$3",
          borderBottom: "1px solid $neutral6",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "$neutral2",
          flexShrink: 0,
        }}
      >
        <Text size="3" css={{ fontWeight: 600 }}>
          Livepeer AI Assistant
        </Text>
        <Box
          as="button"
          onClick={onClose}
          css={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "$neutral11",
            padding: "$1",
            borderRadius: "$2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": {
              backgroundColor: "$neutral4",
            },
          }}
        >
          <Cross2Icon />
        </Box>
      </Flex>

      {/* Messages or Suggestions */}
      {messages.length === 0 ? (
        <Box css={{ flex: 1, overflowY: "auto" }}>
          <Box css={{ padding: "$4", textAlign: "center" }}>
            <Text
              size="3"
              css={{ fontWeight: 600, display: "block", marginBottom: "$1" }}
            >
              Ask me anything about Livepeer
            </Text>
            <Text variant="neutral" size="2">
              I can look up orchestrators, delegators, protocol stats, and more.
            </Text>
          </Box>
          <SuggestedQuestions onSelect={onSelectSuggestion} />
        </Box>
      ) : (
        <MessageThread messages={messages} isLoading={isLoading} />
      )}

      {/* Error display */}
      {error && (
        <Box
          css={{
            padding: "$2 $3",
            backgroundColor: "$red3",
            borderTop: "1px solid $red6",
            flexShrink: 0,
          }}
        >
          <Text size="1" css={{ color: "$red11" }}>
            {error.message ?? "Something went wrong. Please try again."}
          </Text>
        </Box>
      )}

      {/* Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={onSubmitInput}
        isLoading={isLoading}
      />
    </Box>
  );
}
