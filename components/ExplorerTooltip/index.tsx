import { Box, styled, Text } from "@livepeer/design-system";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import React from "react";

type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root> &
  React.ComponentProps<typeof TooltipPrimitive.Content> & {
    children: React.ReactElement;
    content: React.ReactNode;
    multiline?: boolean;
  };

const Content = styled(TooltipPrimitive.Content, {
  length: {},
  backgroundColor: "$neutral4",
  borderRadius: "$1",
  padding: "$1 $2",
  zIndex: "4",

  variants: {
    multiline: {
      true: {
        maxWidth: 250,
        pb: 7,
      },
    },
  },
});

export function ExplorerTooltip({
  children,
  content,
  open,
  defaultOpen,
  onOpenChange,
  multiline,
  ...props
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

      <Content
        side="top"
        align="center"
        sideOffset={5}
        multiline
        {...props}
      >
        <Text
          size="1"
          as="p"
          css={{
            fontSize: "$2",
            textTransform: "none",
            fontWeight: 600,
            color: "white",
            zIndex: "$4",
            lineHeight: multiline ? "20px" : (undefined as any),
          }}
        >
          {content}
        </Text>
        <Box css={{ color: "$neutral4" }}>
          <TooltipPrimitive.Arrow
            offset={5}
            width={11}
            height={5}
            style={{
              fill: "currentColor",
            }}
          />
        </Box>
      </Content>
    </TooltipPrimitive.Root>
  );
}
