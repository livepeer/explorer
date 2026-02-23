import { Box, styled, Text } from "@livepeer/design-system";
import { Tooltip } from "radix-ui";
import React from "react";

import { BaseTooltipProps } from "./types";

type DesktopTooltipProps = BaseTooltipProps &
  Omit<React.ComponentProps<typeof Tooltip.Root>, keyof BaseTooltipProps>;

const Content = styled(Tooltip.Content, {
  length: {},
  backgroundColor: "$neutral4",
  borderRadius: "$1",
  padding: "$1 $2",
  zIndex: "10000",

  variants: {
    multiline: {
      true: {
        maxWidth: 250,
        pb: 7,
      },
    },
  },
});

export function DesktopTooltip({
  children,
  content,
  open,
  defaultOpen,
  onOpenChange,
  multiline,
  ...props
}: DesktopTooltipProps) {
  return (
    <Tooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>

      <Tooltip.Portal>
        <Content side="top" align="center" sideOffset={5} multiline {...props}>
          <Text
            size="1"
            as="div"
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
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
