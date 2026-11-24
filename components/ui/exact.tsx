"use client";

import { Popover } from "@base-ui/react/popover";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

/** Whole part, decimals and unit. */
const PARTS = /^(-?[\d,]+)(?:\.(\d+))?(\s.+)?$/;

/** The figure, with only its unit receding. */
function Figure({ value }: { value: string }) {
  const parts = value.match(PARTS);
  if (!parts) return <>{value}</>;
  const [, whole, decimals, unit] = parts;
  return (
    <>
      <span className="whitespace-nowrap">{whole}</span>
      {/* Only the decimals may wrap, so a phone never splits the whole part. */}
      {decimals && <span className="break-all">.{decimals}</span>}
      {unit && <span className="whitespace-nowrap opacity-65">{unit}</span>}
    </>
  );
}

/** The bare number, as a wallet or a spreadsheet takes it. */
function pasteable(value: string) {
  const parts = value.match(PARTS);
  if (!parts) return value;
  const [, whole, decimals] = parts;
  return whole.replace(/,/g, "") + (decimals ? `.${decimals}` : "");
}

/**
 * A rounded figure that shows its exact value on hover, tap or keyboard
 * press, and copies it on a click. A popover rather than a tooltip, which
 * touch screens never open. Without a `value` (rounding hid nothing), the
 * figure alone.
 */
export function Exact({
  value,
  children,
}: {
  /** The exact figure, from `exactLPT`. */
  value: string | null | undefined;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const reset = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(reset);
  }, [copied]);

  if (!value) return <>{children}</>;

  async function copy() {
    try {
      await navigator.clipboard.writeText(pasteable(value!));
      setCopied(true);
    } catch {
      // clipboard blocked; the figure is still there to select
    }
  }

  return (
    <Popover.Root onOpenChangeComplete={(open) => !open && setCopied(false)}>
      {/* The dotted underline of `Term`, kept quiet until hover so tables of
          figures stay calm. Touch has no hover, so it always shows there. */}
      <Popover.Trigger
        openOnHover
        delay={150}
        className="rounded-sm text-inherit underline decoration-transparent decoration-dotted underline-offset-4 outline-none transition-[text-decoration-color] duration-150 hover:decoration-foreground/40 focus-visible:decoration-foreground/40 focus-visible:ring-1 focus-visible:ring-green-bright/40 data-popup-open:decoration-foreground/40 pointer-coarse:decoration-foreground/30 motion-reduce:transition-none"
      >
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="top"
          sideOffset={6}
          collisionPadding={16}
          className="isolate z-[130]"
        >
          {/* Inverted ink, as the registry tooltip. */}
          <Popover.Popup
            aria-label="Exact amount"
            className="max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-sm bg-foreground text-background shadow-lg outline-none transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none"
          >
            {/* The whole popup is the copy button, taller where it's tapped. */}
            <button
              type="button"
              onClick={copy}
              aria-label="Copy exact amount"
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 text-left outline-none focus-visible:ring-1 focus-visible:ring-green-bright pointer-coarse:px-3 pointer-coarse:py-3"
            >
              {/* The dialog's description, so it's read out on opening. */}
              <Popover.Description
                render={<span />}
                className="font-mono text-xs leading-snug tabular-nums"
              >
                <Figure value={value} />
              </Popover.Description>
              {copied ? (
                <Check aria-hidden className="size-3 shrink-0" />
              ) : (
                <Copy aria-hidden className="size-3 shrink-0 opacity-65" />
              )}
            </button>
            <span role="status" className="sr-only">
              {copied ? "Copied" : ""}
            </span>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
