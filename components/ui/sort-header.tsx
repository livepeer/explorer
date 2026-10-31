"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

/** A sortable, right-aligned table header with an optional hint. */
export function SortHeader<K extends string>({
  label,
  k,
  sort,
  dir,
  onSort,
  className,
  hint,
}: {
  label: string;
  k: K;
  sort: K;
  dir: "asc" | "desc";
  onSort: (k: K) => void;
  className?: string;
  hint?: string;
}) {
  const active = sort === k;
  const Icon = dir === "desc" ? ArrowDown : ArrowUp;
  const button = (
    <button
      type="button"
      onClick={() => onSort(k)}
      className={cn(
        "inline-flex cursor-pointer items-center gap-0.5 rounded-sm transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {label}
      {/* Only on the sorted column: holding its place on the others pushed
          every label off the figures beneath it and widened the table. */}
      {active && <Icon className="size-3" />}
    </button>
  );
  return (
    <th
      aria-sort={
        active ? (dir === "desc" ? "descending" : "ascending") : undefined
      }
      className={cn(
        "px-3 py-2.5 text-right font-normal whitespace-nowrap",
        className
      )}
    >
      {hint ? <Tooltip content={hint}>{button}</Tooltip> : button}
    </th>
  );
}
