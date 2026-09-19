import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-0.5 text-[11px] font-medium leading-[1.35] whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/12 text-primary",
        secondary: "border-border bg-surface-2 text-muted-foreground",
        outline: "border-border text-muted-foreground",
        success: "border-success/30 bg-success/12 text-success",
        warning: "border-warning/30 bg-warning/12 text-warning",
        danger: "border-danger/35 bg-danger/12 text-danger",
        destructive: "border-danger/35 bg-danger/12 text-danger",
        info: "border-info/30 bg-info/12 text-info",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
