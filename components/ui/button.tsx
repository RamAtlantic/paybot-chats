import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45 shrink-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 active:bg-primary/80",
        secondary:
          "bg-surface-2 text-foreground border border-border hover:bg-surface-3 hover:border-border-strong",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface-2 hover:border-border-strong",
        ghost:
          "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        destructive:
          "bg-danger/15 text-danger border border-danger/35 hover:bg-danger/25",
        link: "text-primary underline-offset-4 hover:underline px-0",
      },
      size: {
        xs: "h-7 rounded-[6px] px-2 text-xs gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 px-3 text-[13px]",
        default: "h-9 px-3.5",
        lg: "h-10 px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-7 rounded-[6px] [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
