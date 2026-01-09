import { Tooltip } from "radix-ui";
import React from "react";
import { isMobile } from "react-device-detect";

import { DesktopTooltip } from "./DesktopTooltip";
import { MobileTooltip } from "./MobileTooltip";

export type TooltipProps = React.ComponentProps<typeof Tooltip.Root> &
  Omit<React.ComponentProps<typeof Tooltip.Content>, "content"> & {
    children: React.ReactElement;
    content: React.ReactNode;
    multiline?: boolean;
  };

export function ExplorerTooltip(props: TooltipProps) {
  if (isMobile) {
    return <MobileTooltip {...props} />;
  }
  return <DesktopTooltip {...props} />;
}
