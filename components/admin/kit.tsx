"use client"

import * as React from "react"
import { AlertCircle, Check, Copy, Loader2, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/* ---------------------------------------------------------------- secciones */

export function Section({
  title,
  description,
  actions,
  className,
  children,
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-[13px] text-subtle-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/* -------------------------------------------------------------------- stats */

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
  loading,
  onClick,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  tone?: "neutral" | "primary" | "warning" | "danger" | "info"
  className?: string
  loading?: boolean
  onClick?: () => void
}) {
  const tones: Record<string, string> = {
    neutral: "text-foreground",
    primary: "text-primary",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-info",
  }

  const Comp = onClick ? "button" : "div"

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "hairline rounded-lg border border-border bg-card px-4 py-3.5 text-left transition-colors",
        onClick && "hover:border-border-strong hover:bg-surface-2/50",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">
          {label}
        </span>
        {Icon && <Icon className={cn("size-3.5 shrink-0", tones[tone])} />}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <div className={cn("num mt-1.5 text-[26px] font-semibold leading-none tracking-tight", tones[tone])}>
          {value}
        </div>
      )}
      {hint && <div className="mt-1.5 text-[12px] leading-tight text-subtle-foreground">{hint}</div>}
    </Comp>
  )
}

/* ---------------------------------------------------------------- toolbars */

export function Toolbar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-2 border-b border-border px-4 py-3",
        className
      )}
    >
      {children}
    </div>
  )
}

export function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex min-w-[9rem] flex-col gap-1.5", className)}>
      <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ estados */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {Icon && (
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-surface-2">
          <Icon className="size-4 text-subtle-foreground" />
        </div>
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] text-subtle-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-danger/35 bg-danger/10">
        <AlertCircle className="size-4 text-danger" />
      </div>
      <p className="text-sm font-medium">No se pudo cargar</p>
      <p className="mt-1 max-w-md text-[13px] text-subtle-foreground">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} />
}

export function LoadingRows({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border/70">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-3.5"
              style={{ width: `${[26, 16, 14, 18, 12, 10][c % 6]}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/* --------------------------------------------------------------- paginación */

export function Pagination({
  page,
  totalPages,
  totalCount,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  unit = "registros",
}: {
  page: number
  totalPages: number
  totalCount: number
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  unit?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
      <span className="num text-[12px] text-subtle-foreground">
        Página {page} de {totalPages} · {totalCount.toLocaleString("es-AR")} {unit}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={!hasPrev} onClick={onPrev}>
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={!hasNext} onClick={onNext}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- copiar */

export function CopyValue({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children?: React.ReactNode
}) {
  const [copied, setCopied] = React.useState(false)

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* noop */
        }
      }}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-[5px] px-1 -mx-1 text-left transition-colors hover:bg-surface-2",
        className
      )}
      title="Copiar"
    >
      {children ?? value}
      {copied ? (
        <Check className="size-3 text-primary" />
      ) : (
        <Copy className="size-3 text-subtle-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  )
}

/* --------------------------------------------------------------------- dot */

export function StatusDot({
  tone = "neutral",
  className,
}: {
  tone?: "neutral" | "success" | "warning" | "danger"
  className?: string
}) {
  const tones: Record<string, string> = {
    neutral: "bg-subtle-foreground",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }
  return <span className={cn("inline-block size-1.5 rounded-full", tones[tone], className)} />
}
