"use client";

import { Popover } from "@base-ui/react/popover";

/**
 * A rounded figure that shows its exact value on hover, tap or keyboard
 * press. A popover rather than a tooltip, which touch screens never open.
 * Without a `value` (rounding hid nothing), the figure alone.
 */
export function Exact({
  value,
  children,
}: {
  /** The exact figure, from `exactLPT`. */
  value: string | null | undefined;
  children: React.ReactNode;
}) {
  if (!value) return <>{children}</>;
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        className="rounded-sm text-inherit outline-none focus-visible:ring-1 focus-visible:ring-green-bright/40"
      >
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="top"
          sideOffset={6}
          className="isolate z-[130]"
        >
          {/* Inverted ink, as the registry tooltip, and wrapping anywhere so
              eighteen decimals fit a phone. */}
          <Popover.Popup
            aria-label="Exact amount"
            className="max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-sm bg-foreground px-2.5 py-1.5 text-xs leading-snug break-all text-background tabular-nums outline-none transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0"
          >
            {/* The dialog's description, so it's read out on opening. */}
            <Popover.Description>{value}</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
