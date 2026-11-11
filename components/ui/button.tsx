import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

/**
 * Registry button (`@livepeer-ui/button`). Hierarchy: at most one `primary`
 * per panel — the action the panel exists for. Everything else is `outline`
 * or `ghost`. Green never fills a button.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,transform] duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-green-bright/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "btn-primary",
        outline: "btn-outline",
        ghost:
          "text-muted-foreground hover:bg-hover hover:text-foreground aria-expanded:bg-hover aria-expanded:text-foreground",
        destructive:
          "bg-destructive/15 text-destructive hover:bg-destructive/25",
        link: "px-0 text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-3.5",
        xs: "h-[26px] gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 px-3",
        lg: "h-11 gap-2 px-5 text-[15px]",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-[26px] [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: { variant: "outline", size: "default" },
  }
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      // A button rendered as a link (`render={<Link />}`) isn't a <button>.
      nativeButton={props.render ? false : undefined}
      {...props}
    />
  );
}

export { Button, type ButtonProps, buttonVariants };
