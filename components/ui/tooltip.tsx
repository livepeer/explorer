"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/cn";

function TooltipProvider({
  delay = 150,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

/**
 * Registry tooltip. Inverted ink so it reads as a transient overlay in both
 * themes. `content` is the only required prop for the common case.
 */
function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  children: React.ReactElement<Record<string, unknown>>;
  side?: TooltipPrimitive.Positioner.Props["side"];
  className?: string;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={side}
          sideOffset={6}
          className="isolate z-[130]"
        >
          <TooltipPrimitive.Popup
            className={cn(
              "max-w-xs origin-(--transform-origin) rounded-sm bg-foreground px-2.5 py-1.5 text-xs leading-snug text-background transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
              className
            )}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export { Tooltip, TooltipProvider };
