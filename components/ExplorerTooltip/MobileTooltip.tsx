import { Box, styled, Text } from "@livepeer/design-system";
import { Popover as RadixPopover } from "radix-ui";
import React, { useEffect, useRef } from "react";

import { BaseTooltipProps } from "./types";

type MobileTooltipProps = BaseTooltipProps &
  Omit<React.ComponentProps<typeof RadixPopover.Root>, keyof BaseTooltipProps>;

const RadixPopoverContentStyled = styled(RadixPopover.Content, {
  length: {},
  backgroundColor: "$neutral4 !important",
  borderRadius: "$1",
  padding: "$1 $2",
  zIndex: "10000",
  border: "none",
  outline: "none",
  marginLeft: "$2",
  marginRight: "$2",
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

export function MobileTooltip({
  children,
  content,
  open,
  defaultOpen,
  onOpenChange,
  multiline,
  ...props
}: MobileTooltipProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen ?? false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  // Ref to preserve onOpenChange reference value and protect against unstable references
  const onOpenChangeRef = useRef(onOpenChange);

  // Keep ref updated with latest callback without causing re-renders
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  // Sync internal state with controlled prop
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  // Touch handlers to close tooltip on finger movement
  useEffect(() => {
    if (!isOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
      const threshold = 5; // Minimum movement to trigger close

      // If user moved their finger significantly, close the tooltip
      if (deltaX > threshold || deltaY > threshold) {
        setIsOpen(false);
        onOpenChangeRef.current?.(false);
        touchStartRef.current = null;
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    // Add touch event listeners to document
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChangeRef.current?.(newOpen);
  };

  return (
    <RadixPopover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <RadixPopover.Trigger asChild>{children}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopoverContentStyled
          side="top"
          align="center"
          sideOffset={5}
          multiline
          {...props}
        >
          <Text
            size="1"
            as="div"
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
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
