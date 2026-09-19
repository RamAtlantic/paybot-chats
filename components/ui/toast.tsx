"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="app-ui pointer-events-none fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:top-auto sm:flex-col md:max-w-[400px]">
      {toasts.map(function ({ id, title, description, action, open = true, ...props }) {
        if (!open) return null
        return (
          <Toast key={id} {...props}>
            <div className="flex gap-3">
              <ToastIcon variant={props.variant} />
              <div className="grid gap-0.5 pr-4">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose toastId={id} />
          </Toast>
        )
      })}
    </div>
  )
}

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success"
}

function ToastIcon({ variant }: { variant?: ToastProps["variant"] }) {
  const Icon =
    variant === "destructive" ? AlertTriangle : variant === "success" ? CheckCircle2 : Info
  return (
    <Icon
      className={cn(
        "mt-0.5 size-4 shrink-0",
        variant === "destructive"
          ? "text-danger"
          : variant === "success"
          ? "text-success"
          : "text-primary"
      )}
    />
  )
}

function Toast({ className, variant = "default", ...props }: ToastProps) {
  return (
    <div
      className={cn(
        "animate-in-up pointer-events-auto relative w-full overflow-hidden rounded-lg border bg-popover p-3.5 pr-9 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.7)]",
        variant === "destructive" ? "border-danger/40" : "border-border",
        className
      )}
      {...props}
    />
  )
}

Toast.displayName = "Toast"

function ToastTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[13px] font-semibold text-foreground", className)}
      {...props}
    />
  )
}

ToastTitle.displayName = "ToastTitle"

function ToastDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-[12.5px] leading-snug text-muted-foreground", className)} {...props} />
  )
}

ToastDescription.displayName = "ToastDescription"

function ToastClose({ toastId }: { toastId: string }) {
  const { dismiss } = useToast()

  return (
    <button
      className="absolute right-2 top-2 rounded-[6px] p-1 text-subtle-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        dismiss(toastId)
      }}
    >
      <span className="sr-only">Cerrar</span>
      <X className="size-3.5" />
    </button>
  )
}

ToastClose.displayName = "ToastClose"
