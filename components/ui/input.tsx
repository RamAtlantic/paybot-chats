import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "flex h-9 w-full rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-sm text-foreground transition-colors",
          "placeholder:text-subtle-foreground",
          "file:mr-3 file:h-7 file:rounded-[6px] file:border-0 file:bg-surface-3 file:px-3 file:text-xs file:font-medium file:text-foreground",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-danger/60 aria-[invalid=true]:ring-danger/25",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
