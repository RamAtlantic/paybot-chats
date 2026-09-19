"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowUpRight,
  IdCard,
  Inbox,
  Link2,
  MailWarning,
  MessagesSquare,
  RefreshCw,
  Users,
  Zap,
} from "lucide-react"

import { AdminShell } from "@/components/admin/admin-shell"
import {
  EmptyState,
  Section,
  StatCard,
  StatusDot,
} from "@/components/admin/kit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { API_ENDPOINTS } from "@/lib/api-config"
import { cn } from "@/lib/utils"
import { AccountsService } from "@/services/accounts-service"
import { ResponsesService } from "@/services/responses-service"
import { ContactService } from "@/services/contacts-service"

interface RoomLite {
  id: string
  phone: string
  username?: string
  status: "open" | "closed"
  lastMessage?: string
  lastConnectionDate?: string
  createdAt: string
  connectedCount: number
  unreadCount?: number
  unreadRoom?: boolean
  tags?: string
}

async function fetchRooms(): Promise<{ connections: RoomLite[]; total: number }> {
  const res = await fetch(`${API_ENDPOINTS.rooms}?page=1&limit=8`, { cache: "no-store" })
  if (!res.ok) throw new Error(`No se pudieron traer las conversaciones (${res.status})`)
  const data = await res.json()
  return {
    connections: data.connections || [],
    total: data.pagination?.totalCount ?? (data.connections || []).length,
  }
}

function hora(valor?: string) {
  if (!valor) return "—"
  const d = new Date(valor)
  if (isNaN(d.getTime())) return "—"
  const hoy = new Date().toDateString() === d.toDateString()
  return hoy
    ? d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
}

export default function DashboardPage() {
  const stock = useQuery({
    queryKey: ["accounts-stock", 10],
    queryFn: () => AccountsService.getStock(10),
    refetchInterval: 60_000,
  })

  const rooms = useQuery({
    queryKey: ["dashboard-rooms"],
    queryFn: fetchRooms,
    refetchInterval: 30_000,
  })

  const responses = useQuery({
    queryKey: ["responses"],
    queryFn: () => ResponsesService.getResponses(),
    staleTime: 5 * 60_000,
  })

  const contacts = useQuery({
    queryKey: ["contacts-count"],
    queryFn: () => ContactService.getContacts(1, 1),
    staleTime: 5 * 60_000,
  })

  const totales = stock.data?.totales
  const plataformas = stock.data?.plataformas ?? []
  const enAlerta = plataformas.filter((p) => p.sinStock || p.stockBajo)
  const activas = (responses.data ?? []).filter((r) => r.status)
  const automations = (responses.data ?? []).filter((r) => r.type === "automation")
  const sinLeer = (rooms.data?.connections ?? []).filter(
    (r) => r.unreadRoom || (r.unreadCount ?? 0) > 0
  ).length

  const refrescar = () => {
    stock.refetch()
    rooms.refetch()
    responses.refetch()
    contacts.refetch()
  }

  return (
    <AdminShell
      title="Panel"
      description="Estado del chat externo y del pool de cuentas"
      redirectTo="/join"
      actions={
        <Button variant="ghost" size="icon-sm" onClick={refrescar} title="Actualizar">
          <RefreshCw className={cn(stock.isFetching || rooms.isFetching ? "animate-spin" : "")} />
        </Button>
      }
    >
      <div className="space-y-8">
        {/* ------------------------------------------------------------ kpis */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label="Conversaciones"
            value={rooms.data?.total ?? 0}
            hint="salas registradas"
            icon={MessagesSquare}
            loading={rooms.isLoading}
          />
          <StatCard
            label="Sin leer"
            value={sinLeer}
            hint="en las últimas 8 salas"
            icon={MailWarning}
            tone={sinLeer > 0 ? "warning" : "neutral"}
            loading={rooms.isLoading}
          />
          <StatCard
            label="Cuentas libres"
            value={totales?.disponible ?? 0}
            hint={`${totales?.total ?? 0} cargadas en total`}
            icon={IdCard}
            tone={
              (totales?.disponible ?? 0) === 0
                ? "danger"
                : enAlerta.length > 0
                ? "warning"
                : "primary"
            }
            loading={stock.isLoading}
          />
          <StatCard
            label="Entregadas"
            value={totales?.entregado ?? 0}
            hint="cuentas ya asignadas"
            icon={ArrowUpRight}
            loading={stock.isLoading}
          />
          <StatCard
            label="Contactos"
            value={contacts.data?.pagination?.totalCount ?? 0}
            hint={`${activas.length} respuestas activas`}
            icon={Users}
            loading={contacts.isLoading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* ------------------------------------------------------- stock */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div>
                <CardTitle>Stock por plataforma</CardTitle>
                <p className="mt-1 text-[12px] text-subtle-foreground">
                  Cuentas disponibles para entregar desde el chat
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/registros">
                  Ver registros <ArrowUpRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {stock.isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : plataformas.length === 0 ? (
                <EmptyState
                  icon={IdCard}
                  title="Todavía no hay cuentas cargadas"
                  description="Importá el Excel de cuentas para que el chat pueda entregarlas."
                  action={
                    <Button size="sm" asChild>
                      <Link href="/registros">Importar Excel</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border/70">
                  {plataformas.map((p) => {
                    const pct = p.total ? Math.round((p.disponible / p.total) * 100) : 0
                    return (
                      <li key={p.plataforma} className="flex items-center gap-4 py-2.5 first:pt-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusDot
                              tone={p.sinStock ? "danger" : p.stockBajo ? "warning" : "success"}
                            />
                            <span className="truncate text-[13px] font-medium">{p.plataforma}</span>
                            {p.sinStock ? (
                              <Badge variant="danger">sin stock</Badge>
                            ) : p.stockBajo ? (
                              <Badge variant="warning">stock bajo</Badge>
                            ) : null}
                          </div>
                          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-3">
                            <div
                              className={cn(
                                "h-full rounded-full transition-[width]",
                                p.sinStock ? "bg-danger" : p.stockBajo ? "bg-warning" : "bg-primary"
                              )}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                        <div className="num shrink-0 text-right">
                          <div className="text-[15px] font-semibold leading-none">{p.disponible}</div>
                          <div className="mt-1 text-[11px] text-subtle-foreground">
                            de {p.total}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* ------------------------------------------------ conversaciones */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Últimas conversaciones</CardTitle>
                <p className="mt-1 text-[12px] text-subtle-foreground">
                  Actividad más reciente del chat
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">
                  Abrir chat <ArrowUpRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {rooms.isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : rooms.isError ? (
                <p className="py-6 text-center text-[13px] text-subtle-foreground">
                  No se pudo conectar con la API del chat.
                </p>
              ) : (rooms.data?.connections.length ?? 0) === 0 ? (
                <EmptyState icon={Inbox} title="Sin conversaciones todavía" />
              ) : (
                <ul className="divide-y divide-border/70">
                  {rooms.data!.connections.slice(0, 6).map((room) => {
                    const sinLeerRoom = room.unreadRoom || (room.unreadCount ?? 0) > 0
                    return (
                      <li key={room.id}>
                        <Link
                          href="/admin"
                          className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-surface-2/60"
                        >
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold uppercase text-muted-foreground">
                            {(room.username || room.phone || "??").slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[13px] font-medium">
                                {room.username || room.phone}
                              </span>
                              {room.connectedCount > 0 && <StatusDot tone="success" />}
                            </div>
                            <p className="truncate text-[12px] text-subtle-foreground">
                              {room.lastMessage || "Sin mensajes"}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="num text-[11px] text-subtle-foreground">
                              {hora(room.lastConnectionDate || room.createdAt)}
                            </div>
                            {sinLeerRoom && (
                              <span className="mt-1 inline-block rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                                {room.unreadCount || "•"}
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* -------------------------------------------------------- accesos */}
        <Section title="Accesos rápidos">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink
              href="/registros"
              icon={IdCard}
              title="Registros"
              description="Importar Excel, ver stock y liberar cuentas"
            />
            <QuickLink
              href="/responses"
              icon={Zap}
              title="Respuestas"
              description={`${activas.length} activas · ${automations.length} automations`}
            />
            <QuickLink
              href="/contacts"
              icon={Users}
              title="Contactos"
              description="Base de jugadores y etiquetas"
            />
            <QuickLink
              href="/admin/invite"
              icon={Link2}
              title="Invitaciones"
              description="Generar link de chat por teléfono"
            />
          </div>
        </Section>
      </div>
    </AdminShell>
  )
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: typeof IdCard
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="hairline group flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3.5 transition-colors hover:border-border-strong hover:bg-surface-2/50"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 transition-colors group-hover:border-primary/40">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{title}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-subtle-foreground">{description}</p>
      </div>
      <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-subtle-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}
