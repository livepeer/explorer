import { Box, styled, Text } from "@livepeer/design-system";
import { Tooltip, Popover as RadixPopover } from "radix-ui";
import React, { useState } from "react";
import { isMobile } from "react-device-detect";

type TooltipProps = React.ComponentProps<typeof Tooltip.Root> &
  Omit<React.ComponentProps<typeof Tooltip.Content>, "content"> & {
    children: React.ReactElement;
    content: React.ReactNode;
    multiline?: boolean;
  };

const Content = styled(Tooltip.Content, {
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

const RadixPopoverContentStyled = styled(RadixPopover.Content, {
  length: {},
  backgroundColor: "$neutral4 !important",
  borderRadius: "$1",
  padding: "$1 $2",
  zIndex: "4",
  border: "none",
  outline: "none",
  boxShadow: "none",
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
  // Mobile: Use Popover (tap to open/close)
  if (isMobile) {
    return (
      <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
        <RadixPopover.Trigger asChild>{children}</RadixPopover.Trigger>
        <RadixPopoverContentStyled
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
              fontWeight: 400,
              color: "white",
              zIndex: "$4",
              lineHeight: multiline ? "20px" : undefined,
            }}
          >
            {content}
          </Text>
          <Box css={{ color: "$neutral4" }}>
            <RadixPopover.Arrow
              offset={5}
              width={11}
              height={5}
              style={{
                fill: "currentColor",
              }}
            />
          </Box>
        </RadixPopoverContentStyled>
      </RadixPopover.Root>
    );
  }

  // Desktop: Use Tooltip (hover to show)
  return (
    <Tooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>

      <Content side="top" align="center" sideOffset={5} multiline {...props}>
        <Text
          size="1"
          as="p"
          css={{
            fontSize: "$2",
            textTransform: "none",
            fontWeight: 600,
            color: "white",
            zIndex: "$4",
            lineHeight: multiline ? "20px" : undefined,
          }}
        >
          {content}
        </Text>
        <Box css={{ color: "$neutral4" }}>
          <Tooltip.Arrow
            offset={5}
            width={11}
            height={5}
            style={{
              fill: "currentColor",
            }}
          />
        </Box>
      </Content>
    </Tooltip.Root>
  );
}
