import { Tooltip } from "radix-ui";
import React from "react";

// Base props that both tooltips share
export interface BaseTooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  multiline?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  open?: boolean;
  defaultOpen?: boolean;
  /**
   * Callback when tooltip open state changes.
   * For optimal performance, memoize this function with useCallback.
   */
  onOpenChange?: (open: boolean) => void;
}

// Public API type (what consumers use)
export type TooltipProps = BaseTooltipProps &
  Omit<React.ComponentProps<typeof Tooltip.Root>, keyof BaseTooltipProps> &
  Omit<
    React.ComponentProps<typeof Tooltip.Content>,
    "content" | keyof BaseTooltipProps
  >;
