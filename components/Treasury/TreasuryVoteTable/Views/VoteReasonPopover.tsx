import {
  Box,
  HoverCardArrow,
  HoverCardContent,
  HoverCardRoot,
  HoverCardTrigger,
  styled,
  Text,
} from "@livepeer/design-system";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import React from "react";

const Content = styled(HoverCardContent, {
  width: 320,
  padding: "$3",
  backgroundColor: "$neutral3",
  border: "1px solid $neutral5",
  borderRadius: "$3",
  boxShadow:
    "0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)",
  zIndex: 100,
  outline: "none",
  animationDuration: "400ms",
  animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  willChange: "transform, opacity",
});

interface VoteReasonPopoverProps {
  reason: string;
  children?: React.ReactNode;
}

export function VoteReasonPopover({
  reason,
  children,
}: VoteReasonPopoverProps) {
  if (!reason || reason.toLowerCase() === "no reason provided") {
    return null;
  }

  return (
    <HoverCardRoot openDelay={200} closeDelay={300}>
      <HoverCardTrigger asChild>
        {children || (
          <Box
            as="button"
            css={{
              display: "inline-flex",
              alignItems: "center",
              gap: "$1",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: "$neutral3",
              border: "1px solid $neutral5",
              color: "$neutral11",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "$neutral4",
                color: "$hiContrast",
                borderColor: "$neutral6",
              },
              "&:focus-visible": {
                outline: "2px solid $primary11",
                outlineOffset: "2px",
              },
            }}
          >
            <ChatBubbleIcon />
            <Text size="1" css={{ fontWeight: 500, color: "inherit" }}>
              Reason
            </Text>
          </Box>
        )}
      </HoverCardTrigger>
      <Content side="top" align="start" sideOffset={8}>
        <Box
          css={{
            marginBottom: "$2",
            paddingBottom: "$1",
            borderBottom: "1px solid $neutral5",
          }}
        >
          <Text
            size="1"
            css={{
              fontWeight: 600,
              color: "$neutral11",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Vote Reason
          </Text>
        </Box>
        <Text
          size="2"
          css={{
            color: "$hiContrast",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {reason}
        </Text>
        <Box css={{ color: "$neutral5" }}>
          <HoverCardArrow
            style={{ fill: "currentColor" }}
            width={12}
            height={6}
          />
        </Box>
      </Content>
    </HoverCardRoot>
  );
}
