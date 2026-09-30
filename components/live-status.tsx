"use client";

import { useNow } from "@/components/shell/round-clock";
import { StatusDot } from "@/components/ui/misc";

/** "Live · updated 12s ago", or a warning when polling fails. */
export function LiveStatus({
  updatedAt,
  failing,
}: {
  updatedAt: number;
  failing: boolean;
}) {
  const now = useNow(5_000);
  const secs = updatedAt
    ? Math.max(0, Math.round((now - updatedAt) / 1000))
    : 0;
  return (
    <span className="flex items-center gap-2 text-ui-caption text-muted-foreground">
      <StatusDot pulse={!failing} tone={failing ? "warning" : "positive"} />
      {failing
        ? "Reconnecting…"
        : updatedAt
        ? `Live · updated ${secs < 5 ? "just now" : `${secs}s ago`}`
        : "Live"}
    </span>
  );
}
