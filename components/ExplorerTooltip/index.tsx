import { isMobile } from "react-device-detect";

import { DesktopTooltip } from "./DesktopTooltip";
import { MobileTooltip } from "./MobileTooltip";
import { TooltipProps } from "./types";

export type { TooltipProps };

export function ExplorerTooltip(props: TooltipProps) {
  if (isMobile) {
    return <MobileTooltip {...props} />;
  }
  return <DesktopTooltip {...props} />;
}
