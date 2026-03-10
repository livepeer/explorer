import { Box, Flex } from "@livepeer/design-system";
import React, { useCallback, useRef } from "react";

export default function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
}: {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          onSubmit();
        }
      }
    },
    [input, isLoading, onSubmit]
  );

  return (
    <Flex
      css={{
        padding: "$2 $3",
        borderTop: "1px solid $neutral6",
        gap: "$2",
        alignItems: "flex-end",
      }}
    >
      <Box
        as="textarea"
        ref={inputRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setInput(e.target.value)
        }
        onKeyDown={handleKeyDown}
        placeholder="Ask about Livepeer..."
        rows={1}
        css={{
          flex: 1,
          resize: "none",
          border: "1px solid $neutral6",
          borderRadius: "$2",
          padding: "$2",
          fontSize: "$2",
          fontFamily: "inherit",
          backgroundColor: "$neutral2",
          color: "$hiContrast",
          outline: "none",
          maxHeight: 80,
          "&:focus": {
            borderColor: "$primary9",
          },
          "&::placeholder": {
            color: "$neutral9",
          },
        }}
      />
      <Box
        as="button"
        onClick={() => {
          if (input.trim() && !isLoading) onSubmit();
        }}
        disabled={!input.trim() || isLoading}
        css={{
          padding: "$2 $3",
          borderRadius: "$2",
          border: "none",
          backgroundColor: isLoading || !input.trim() ? "$neutral6" : "$primary9",
          color: "white",
          cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
          fontSize: "$2",
          fontWeight: 600,
          flexShrink: 0,
          "&:hover:not(:disabled)": {
            backgroundColor: "$primary10",
          },
        }}
      >
        {isLoading ? "..." : "Send"}
      </Box>
    </Flex>
  );
}
