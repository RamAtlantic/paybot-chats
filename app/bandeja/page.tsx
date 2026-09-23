"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Check,
  Clock,
  ExternalLink,
  HelpCircle,
  Inbox,
  MessageSquareWarning,
  Receipt,
  RefreshCw,
  Send,
  Users,
  X,
} from "lucide-react"

import { AdminShell } from "@/components/admin/admin-shell"
import { EmptyState, Spinner, StatCard } from "@/components/admin/kit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-provider"
import { useToast } from "@/hooks/use-toast"
import {
  InboxService,
  type Carga,
  type EsperaPlataforma,
  type Hueco,
  type InboxResumen,
  type Tarea,
} from "@/services/inbox-service"

function fecha(valor?: string | null) {
  if (!valor) return "—"
  const d = new Date(valor)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function plata(monto: number | null, moneda = "ARS") {
  if (monto === null || monto === undefined) return "no se pudo leer"
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: moneda }).format(monto)
}

export default function BandejaPage() {
  const { toast } = useToast()
  const { user } = useAuth()

  const [resumen, setResumen] = React.useState<InboxResumen | null>(null)
  const [cargas, setCargas] = React.useState<Carga[]>([])
  const [tareas, setTareas] = React.useState<Tarea[]>([])
  const [huecos, setHuecos] = React.useState<Hueco[]>([])
  const [espera, setEspera] = React.useState<EsperaPlataforma[]>([])
  const [cargando, setCargando] = React.useState(true)
  const [trabajando, setTrabajando] = React.useState<string | null>(null)

  const cargar = React.useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true)
      try {
        const [r, c, t, h, e] = await Promise.all([
          InboxService.resumen(),
          InboxService.cargas("pendiente"),
          InboxService.tareas("abierta"),
          InboxService.huecos(),
          InboxService.espera(),
        ])
        setResumen(r)
        setCargas(c)
        setTareas(t)
        setHuecos(h)
        setEspera(e)
      } catch (error) {
        toast({
          title: "No se pudo cargar la bandeja",
          description: error instanceof Error ? error.message : "Probá de nuevo",
          variant: "destructive",
        })
      } finally {
        setCargando(false)
      }
    },
    [toast]
  )

  React.useEffect(() => {
    cargar()
    const t = setInterval(() => cargar(true), 60_000)
    return () => clearInterval(t)
  }, [cargar])

  const conAviso = async (clave: string, fn: () => Promise<unknown>, titulo: string) => {
    setTrabajando(clave)
    try {
      await fn()
      toast({ title: titulo, variant: "success" })
      await cargar(true)
    } catch (error) {
      toast({
        title: "No se pudo",
        description: error instanceof Error ? error.message : "Probá de nuevo",
        variant: "destructive",
      })
    } finally {
      setTrabajando(null)
    }
  }

  if (cargando) {
    return (
      <AdminShell title="Bandeja" description="Lo que el agente dejó para revisar">
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Bandeja"
      description="Lo que el agente dejó para revisar"
      actions={
        <Button variant="secondary" size="sm" onClick={() => cargar()}>
          <RefreshCw className="size-3.5" /> Actualizar
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Cargas por verificar" value={resumen?.cargasPendientes ?? 0} icon={Receipt} />
          <StatCard label="Conversaciones escaladas" value={resumen?.tareasAbiertas ?? 0} icon={MessageSquareWarning} />
          <StatCard label="Preguntas sin respuesta" value={resumen?.huecosAbiertos ?? 0} icon={HelpCircle} />
          <StatCard label="Esperando stock" value={resumen?.esperandoStock ?? 0} icon={Users} />
        </div>

        <Tabs defaultValue="cargas">
          <TabsList>
            <TabsTrigger value="cargas">Cargas ({cargas.length})</TabsTrigger>
            <TabsTrigger value="tareas">Pendientes ({tareas.length})</TabsTrigger>
            <TabsTrigger value="huecos">Preguntas ({huecos.length})</TabsTrigger>
            <TabsTrigger value="espera">Sin stock ({espera.length})</TabsTrigger>
          </TabsList>

          {/* --------------------------------------------------------- cargas */}
          <TabsContent value="cargas" className="mt-4 space-y-3">
            {cargas.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No hay cargas por verificar"
                description="Cuando el agente lea un comprobante, la carga aparece acá para que la confirmes."
              />
            ) : (
              cargas.map((c) => (
                <Card key={c._id} className={c.sospechas.length ? "border-warning/40" : undefined}>
                  <CardContent className="flex flex-wrap items-start gap-4 py-4">
                    {c.comprobante.url && (
                      <a
                        href={c.comprobante.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 overflow-hidden rounded-md border border-border"
                        title="Abrir el comprobante"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.comprobante.url} alt="Comprobante" className="size-24 object-cover" />
                      </a>
                    )}

                    <div className="min-w-[14rem] flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold">{plata(c.monto, c.moneda)}</span>
                        {c.lectura.confianza && (
                          <Badge variant={c.lectura.confianza === "alta" ? "secondary" : "warning"}>
                            lectura {c.lectura.confianza}
                          </Badge>
                        )}
                      </div>

                      <p className="text-[13px] text-subtle-foreground">
                        {c.lectura.titular ? `De ${c.lectura.titular}` : "Titular no leído"}
                        {c.lectura.banco ? ` · ${c.lectura.banco}` : ""}
                        {c.lectura.fechaComprobante ? ` · ${c.lectura.fechaComprobante}` : ""}
                      </p>

                      <p className="text-[12px] text-subtle-foreground">
                        {c.phone || "sin teléfono"} · registrada {fecha(c.createdAt)}
                        {c.roomId && (
                          <>
                            {" · "}
                            <Link
                              href={`/admin/chat/${c.roomId}`}
                              className="inline-flex items-center gap-0.5 underline"
                            >
                              ver el chat <ExternalLink className="size-3" />
                            </Link>
                          </>
                        )}
                      </p>

                      {c.sospechas.map((s, i) => (
                        <p key={i} className="flex items-start gap-1.5 text-[13px] text-warning">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                          {s.detalle}
                        </p>
                      ))}

                      {c.lectura.observaciones && (
                        <p className="text-[12px] italic text-subtle-foreground">
                          {c.lectura.observaciones}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        disabled={trabajando === c._id}
                        onClick={() =>
                          conAviso(
                            c._id,
                            () => InboxService.acreditar(c._id, user?.email || undefined, true),
                            "Carga acreditada y avisada"
                          )
                        }
                      >
                        {trabajando === c._id ? <Spinner /> : <Check className="size-3.5" />} Acreditar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={trabajando === c._id}
                        onClick={() =>
                          conAviso(
                            c._id,
                            () => InboxService.rechazar(c._id, user?.email || undefined),
                            "Carga rechazada"
                          )
                        }
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* -------------------------------------------------------- tareas */}
          <TabsContent value="tareas" className="mt-4 space-y-3">
            {tareas.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No hay nada pendiente"
                description="Cuando el agente escale una conversación, aparece acá."
              />
            ) : (
              tareas.map((t) => (
                <Card key={t._id}>
                  <CardContent className="flex flex-wrap items-start justify-between gap-3 py-4">
                    <div className="min-w-[16rem] flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{t.titulo}</span>
                        {t.prioridad === "alta" && <Badge variant="danger">alta</Badge>}
                        <Badge variant="outline">{t.tipo}</Badge>
                        {t.veces > 1 && <Badge variant="warning">{t.veces} veces</Badge>}
                      </div>
                      <p className="text-[13px] text-subtle-foreground">{t.detalle}</p>
                      <p className="text-[12px] text-subtle-foreground">
                        {fecha(t.createdAt)}
                        {t.roomId && (
                          <>
                            {" · "}
                            <Link
                              href={`/admin/chat/${t.roomId}`}
                              className="inline-flex items-center gap-0.5 underline"
                            >
                              abrir el chat <ExternalLink className="size-3" />
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={trabajando === t._id}
                      onClick={() =>
                        conAviso(
                          t._id,
                          () => InboxService.resolverTarea(t._id, user?.email || undefined),
                          "Pendiente resuelto"
                        )
                      }
                    >
                      {trabajando === t._id ? <Spinner /> : <Check className="size-3.5" />} Listo
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* -------------------------------------------------------- huecos */}
          <TabsContent value="huecos" className="mt-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Lo que el agente no supo contestar</CardTitle>
                  <CardDescription>
                    Ordenado por cuántas veces lo preguntaron. Cada línea es un texto que falta
                    escribir en Respuestas.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {huecos.length === 0 ? (
                  <EmptyState
                    icon={HelpCircle}
                    title="Todavía no hay preguntas sin respuesta"
                    description="Van a aparecer acá a medida que el agente se encuentre con consultas que no cubre el funnel."
                  />
                ) : (
                  <ul className="space-y-3">
                    {huecos.map((h) => (
                      <li
                        key={h._id}
                        className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div className="min-w-[14rem] flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={h.veces > 3 ? "warning" : "secondary"}>{h.veces}×</Badge>
                            <span className="text-[13px] font-medium">{h.pregunta}</span>
                          </div>
                          <p className="mt-0.5 text-[12px] text-subtle-foreground">
                            <Clock className="mr-1 inline size-3" />
                            primera vez {fecha(h.primeraVez)} · última {fecha(h.ultimaVez)}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={trabajando === h._id}
                          onClick={() =>
                            conAviso(
                              h._id,
                              () => InboxService.resolverHueco(h._id, user?.email || undefined),
                              "Marcada como resuelta"
                            )
                          }
                        >
                          <Check className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* -------------------------------------------------------- espera */}
          <TabsContent value="espera" className="mt-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Esperando que entre stock</CardTitle>
                  <CardDescription>
                    Pidieron usuario cuando no quedaban. Al avisarles les llega el botón para
                    pedirlo, y los que mientras tanto ya consiguieron cuenta se saltean solos.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {espera.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No hay nadie esperando"
                    description="Cuando alguien pida un usuario y no haya stock, queda anotado acá."
                  />
                ) : (
                  <ul className="space-y-3">
                    {espera.map((e) => (
                      <li
                        key={e.plataforma}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-[13px] font-medium">{e.plataforma}</p>
                          <p className="text-[12px] text-subtle-foreground">
                            {e.esperando} esperando · el más viejo desde {fecha(e.desde)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={trabajando === e.plataforma}
                          onClick={() =>
                            conAviso(
                              e.plataforma,
                              () => InboxService.avisarEspera(e.plataforma, user?.email || undefined),
                              `Avisado a los que esperaban ${e.plataforma}`
                            )
                          }
                        >
                          {trabajando === e.plataforma ? <Spinner /> : <Send className="size-3.5" />}{" "}
                          Avisar que hay stock
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  )
}
