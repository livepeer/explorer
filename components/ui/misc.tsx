"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { motion } from "motion/react";
import { useId } from "react";

import { cn } from "@/lib/cn";

/* ── Input ───────────────────────────────────────────────────────────────── */

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      className={cn(
        "h-9 w-full min-w-0 rounded-sm border border-transparent bg-input/50 px-3 text-base transition-[box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40 disabled:opacity-50 aria-invalid:ring-1 aria-invalid:ring-destructive/50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */

/** Same silhouette as what it stands in for; pulses quietly. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-sm bg-foreground/[0.06]",
        className
      )}
    />
  );
}

/* ── Segmented control ───────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "sm",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: React.ReactNode }[];
  label: string;
  size?: "sm" | "xs";
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-sm bg-hover p-0.5",
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative cursor-pointer rounded-[4px] font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-green-bright/40",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-6 px-2 text-[11px]",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[4px] bg-secondary shadow-[0_1px_2px_rgb(0_0_0/0.2)] light:bg-background"
                transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Menu ────────────────────────────────────────────────────────────────── */

export const Menu = MenuPrimitive.Root;
export const MenuTrigger = MenuPrimitive.Trigger;

export function MenuContent({
  children,
  align = "end",
  className,
}: {
  children: React.ReactNode;
  align?: MenuPrimitive.Positioner.Props["align"];
  className?: string;
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        sideOffset={6}
        className="z-[120]"
      >
        <MenuPrimitive.Popup
          className={cn(
            "min-w-44 origin-(--transform-origin) rounded-xl border border-hairline bg-popover p-1 text-sm shadow-(--shadow-popover) outline-none transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
            className
          )}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export const MenuSub = MenuPrimitive.SubmenuRoot;
export const MenuSubTrigger = MenuPrimitive.SubmenuTrigger;

/** A submenu's popup, opening beside its trigger. */
export function MenuSubContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        side="inline-end"
        align="start"
        sideOffset={4}
        className="z-[121]"
      >
        <MenuPrimitive.Popup
          className={cn(
            "min-w-44 origin-(--transform-origin) rounded-xl border border-hairline bg-popover p-1 text-sm shadow-(--shadow-popover) outline-none transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
            className
          )}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export function MenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2.5 text-ui-body text-foreground outline-none select-none data-disabled:opacity-40 data-highlighted:bg-hover [&_svg]:size-4 [&_svg]:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function MenuSeparator() {
  return <MenuPrimitive.Separator className="mx-1 my-1 h-px bg-hairline" />;
}

/* ── Status dot ──────────────────────────────────────────────────────────── */

export function StatusDot({
  tone = "positive",
  pulse = false,
  className,
}: {
  tone?: "positive" | "warning" | "neutral" | "negative";
  pulse?: boolean;
  className?: string;
}) {
  const color = {
    positive: "bg-green-bright",
    warning: "bg-warm",
    neutral: "bg-muted-foreground",
    negative: "bg-destructive",
  }[tone];
  return (
    <span
      className={cn("relative inline-flex size-1.5 shrink-0", className)}
      aria-hidden="true"
    >
      {pulse && (
        <span
          className={cn("absolute inset-0 animate-halo rounded-full", color)}
        />
      )}
      <span className={cn("relative size-1.5 rounded-full", color)} />
    </span>
  );
}
