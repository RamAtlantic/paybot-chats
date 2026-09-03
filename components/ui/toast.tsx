"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, action, open = true, ...props }) {
        if (!open) return null
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
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
  variant?: "default" | "destructive"
}

function Toast({ className, ...props }: ToastProps) {
  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all border-blue-500 bg-blue-600 text-white",
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
      className={cn("text-sm font-semibold text-white", className)}
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
    <p
      className={cn("text-sm opacity-90 text-white", className)}
      {...props}
    />
  )
}

ToastDescription.displayName = "ToastDescription"

function ToastClose({ toastId }: { toastId: string }) {
  const { dismiss } = useToast()

  return (
    <button
      className="absolute right-2 top-2 rounded-md p-1 text-white opacity-70 transition-opacity hover:opacity-100 hover:text-gray-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        dismiss(toastId)
      }}
    >
      <span className="sr-only">Cerrar</span>
      <svg
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}

ToastClose.displayName = "ToastClose"
