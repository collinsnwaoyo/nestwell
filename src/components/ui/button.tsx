import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * One button system. Three tiers (primary, secondary, ghost) plus destructive
 * for the final confirm of an irreversible action. Heights: 36px, 32px
 * compact, 44px on touch layouts. An invisible 4px halo keeps every hit
 * area at least 40px even when the button looks smaller.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent text-body font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-(--dur-1) ease-out active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "after:absolute after:-inset-1 after:content-['']",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-1 hover:bg-primary-hover",
        secondary: "border-border-strong bg-surface text-foreground hover:border-faint hover:shadow-1",
        ghost: "text-muted-foreground hover:bg-surface-sunk hover:text-foreground",
        destructive: "bg-danger text-primary-foreground shadow-1 hover:bg-danger/90",
      },
      size: {
        default: "h-9 px-3.5 max-md:h-11 max-md:px-4",
        compact: "h-8 px-3 max-md:h-10",
        icon: "size-9 max-md:size-11",
        "icon-compact": "size-8 max-md:size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
