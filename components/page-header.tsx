"use client";

import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

/** Where the app header takes a page's description and buttons on desktop. */
export const PAGE_INFO_SLOT = "page-info-slot";
export const PAGE_ACTIONS_SLOT = "page-actions-slot";

/** The ⓘ beside the page name in the header, opening the page's description. */
function PageInfo({ children }: { children: React.ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="About this page"
        className="inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-subtle-foreground transition-colors outline-none hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40 data-popup-open:bg-hover data-popup-open:text-foreground"
      >
        <Info className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={8}
          className="z-[120]"
        >
          <Popover.Popup className="max-w-sm origin-(--transform-origin) rounded-xl border border-hairline bg-popover px-4 py-3 text-ui-body leading-6 text-muted-foreground text-pretty shadow-(--shadow-popover) outline-none transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function useSlot(id: string) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => setNode(document.getElementById(id)), [id]);
  return node;
}

/**
 * A page's title, description and buttons. On phones they sit at the top of
 * the page. On desktop the app header already names the page, so the title
 * stays for screen readers only, the description moves behind an ⓘ beside
 * that name, and the buttons join the header's right side, Linear-style, so
 * the page opens on its content.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const info = useSlot(PAGE_INFO_SLOT);
  const actionsSlot = useSlot(PAGE_ACTIONS_SLOT);
  return (
    <>
      <header
        className={cn(
          "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
          className,
          // Only the title stays on desktop, and only for screen readers; the
          // rest is shown in the app header instead, so it isn't kept twice.
          "lg:mb-0"
        )}
      >
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow && (
            <div className="text-ui-caption text-muted-foreground lg:hidden">
              {eyebrow}
            </div>
          )}
          <h1 className="text-page-title font-semibold tracking-[-0.02em] text-balance lg:sr-only">
            {title}
          </h1>
          {description && (
            <p className="max-w-[62ch] text-ui-body text-muted-foreground text-pretty lg:hidden">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:hidden">
            {actions}
          </div>
        )}
      </header>
      {description &&
        info &&
        createPortal(<PageInfo>{description}</PageInfo>, info)}
      {actions && actionsSlot && createPortal(actions, actionsSlot)}
    </>
  );
}
