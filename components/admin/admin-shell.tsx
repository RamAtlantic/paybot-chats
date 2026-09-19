"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Check,
  ChevronLeft,
  Copy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { isActivePath, navGroups, navItems } from "@/lib/nav"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { useAuth } from "@/context/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useSettingsDisplay } from "@/hooks/use-settings"

const COLLAPSE_KEY = "admin:sidebar-collapsed"

interface AdminShellProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  /** Contenido a pantalla completa (chat): sin padding ni scroll propio. */
  fullBleed?: boolean
  /** A dónde mandar a quien no tiene sesión (la home manda al chat). */
  redirectTo?: string
  children: React.ReactNode
}

export function AdminShell({
  title,
  description,
  actions,
  fullBleed = false,
  redirectTo,
  children,
}: AdminShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1")
    } catch {
      /* sin storage, queda expandido */
    }
  }, [])

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0")
      } catch {
        /* noop */
      }
      return next
    })
  }

  const current = navItems.find((item) => isActivePath(pathname, item))
  const heading = title ?? current?.label ?? "Panel"
  const sub = description ?? current?.description

  return (
    <ProtectedRoute redirectTo={redirectTo}>
      <div className="app-ui app-backdrop min-h-screen text-foreground">
        {/* ---------------------------------------------------------- sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          className="hidden md:flex"
        />

        {/* --------------------------------------------------- drawer mobile */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <Sidebar
              collapsed={false}
              onToggleCollapsed={() => setMobileOpen(false)}
              mobile
              onClose={() => setMobileOpen(false)}
              className="absolute inset-y-0 left-0 flex animate-in-up"
            />
          </div>
        )}

        {/* ------------------------------------------------------------ main */}
        <div
          className={cn(
            "flex min-h-screen flex-col transition-[padding] duration-200",
            collapsed ? "md:pl-[4.25rem]" : "md:pl-[15.5rem]"
          )}
        >
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-6">
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu />
            </Button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold tracking-tight">{heading}</h1>
              {sub && (
                <p className="truncate text-[12px] leading-tight text-subtle-foreground">{sub}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {actions}
              <CopyInviteButton />
            </div>
          </header>

          <main
            className={cn(
              "flex-1",
              fullBleed ? "min-h-0" : "mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

/* ------------------------------------------------------------------ sidebar */

function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobile = false,
  onClose,
  className,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobile?: boolean
  onClose?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { data: settings } = useSettingsDisplay()

  const logo = settings?.profileImage?.originalUrl
    ? `${process.env.NEXT_PUBLIC_PUBLIC_CDN_URL || ""}${settings.profileImage.originalUrl}`
    : "/logo.png"

  return (
    <aside
      className={cn(
        "z-50 h-screen w-[15.5rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        !mobile && "fixed inset-y-0 left-0 transition-[width] duration-200",
        !mobile && collapsed && "w-[4.25rem]",
        className
      )}
    >
      {/* marca */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-3",
          collapsed && !mobile && "justify-center px-0"
        )}
      >
        <div className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
          <Image
            src={logo}
            alt=""
            fill
            sizes="32px"
            className="object-cover"
            unoptimized
          />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight">
              {settings?.displayName || "Chat externo"}
            </p>
            <p className="truncate text-[11px] leading-tight text-subtle-foreground">
              Panel de operación
            </p>
          </div>
        )}
        {mobile && (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar menú">
            <X />
          </Button>
        )}
      </div>

      {/* navegación */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            {(!collapsed || mobile) && (
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed && !mobile ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors",
                        collapsed && !mobile && "justify-center px-0",
                        active
                          ? "bg-sidebar-accent text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-primary" : "text-subtle-foreground group-hover:text-foreground"
                        )}
                      />
                      {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* pie: usuario */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        {(!collapsed || mobile) && (
          <div className="mb-1.5 flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold uppercase text-primary">
              {(user?.email || "?").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium leading-tight">
                {user?.email || "Operador"}
              </p>
              <p className="text-[11px] leading-tight text-subtle-foreground">Sesión activa</p>
            </div>
          </div>
        )}

        <div className={cn("flex items-center gap-1", collapsed && !mobile && "flex-col")}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 justify-start text-danger hover:bg-danger/10 hover:text-danger",
              collapsed && !mobile && "w-full justify-center px-0"
            )}
            onClick={async () => {
              await logout()
              router.push("/login")
            }}
            title="Cerrar sesión"
          >
            <LogOut className="size-4" />
            {(!collapsed || mobile) && <span>Salir</span>}
          </Button>

          {!mobile && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapsed}
              title={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}

/* -------------------------------------------------------- copiar link /join */

function CopyInviteButton() {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    const base =
      process.env.NEXT_PUBLIC_URL_DEPLOY_VERCEL ||
      (typeof window !== "undefined" ? window.location.origin : "")
    try {
      await navigator.clipboard.writeText(`${base}/join`)
      setCopied(true)
      toast({ title: "Link copiado", description: `${base}/join`, variant: "success" })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "No se pudo copiar",
        description: "Copialo a mano desde la barra del navegador",
        variant: "destructive",
      })
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={copy} title="Copiar link de invitación">
      {copied ? <Check className="text-primary" /> : <Copy />}
      <span className="hidden sm:inline">{copied ? "Copiado" : "Link de invitación"}</span>
    </Button>
  )
}

/* ------------------------------------------------------- volver (secundario) */

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-3.5" />
      {children}
    </Link>
  )
}
