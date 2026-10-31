"use client";

import { Tooltip } from "@/components/ui/tooltip";

/** A label with a definition on hover, marked by a dotted underline. */
export function Term({
  hint,
  children,
}: {
  hint: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Tooltip content={hint}>
      <span className="cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-4">
        {children}
      </span>
    </Tooltip>
  );
}
