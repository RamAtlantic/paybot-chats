"use client"

import * as React from "react"
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Cpu,
  History,
  KeyRound,
  MessageSquareText,
  Power,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Zap,
} from "lucide-react"

import { AdminShell } from "@/components/admin/admin-shell"
import { EmptyState, Spinner } from "@/components/admin/kit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AgentService, type AgentConfig, type AgentRun } from "@/services/agent-service"

/** Qué significa cada variable que puede faltar del lado del servidor. */
const EXPLICACION_FALTANTES: Record<string, string> = {
  CONFIG_ENCRYPTION_KEY:
    "Sin esta variable la API key de Claude no se puede guardar cifrada, así que no se guarda.",
  AGENT_API_KEY: "Es la clave con la que el servicio del agente le habla a la API.",
  AGENT_WEBHOOK_URL: "Es la dirección del servicio del agente: sin esto nunca se entera de un turno.",
}

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

const COLOR_ESTADO: Record<AgentRun["estado"], string> = {
  respondido: "text-emerald-500",
  entregado: "text-sky-500",
  despachado: "text-amber-500",
  fallido: "text-destructive",
}

export default function AgentePage() {
  const { toast } = useToast()
  const { user } = useAuth()

  const [config, setConfig] = React.useState<AgentConfig | null>(null)
  const [runs, setRuns] = React.useState<AgentRun[]>([])
  const [cargando, setCargando] = React.useState(true)
  const [guardando, setGuardando] = React.useState(false)
  const [probando, setProbando] = React.useState(false)
  const [sucio, setSucio] = React.useState(false)

  // La key nueva vive sólo en el form: la guardada nunca vuelve del servidor.
  const [keyNueva, setKeyNueva] = React.useState("")
  const [cambiandoKey, setCambiandoKey] = React.useState(false)
  const [modelo, setModelo] = React.useState("")
  const [maxTokens, setMaxTokens] = React.useState("1024")
  const [systemPrompt, setSystemPrompt] = React.useState("")

  const aplicar = React.useCallback((c: AgentConfig) => {
    setConfig(c)
    setModelo(c.modelo)
    setMaxTokens(String(c.maxTokens))
    setSystemPrompt(c.systemPrompt)
    setKeyNueva("")
    setCambiandoKey(!c.claudeKeyConfigurada)
    setSucio(false)
  }, [])

  const cargar = React.useCallback(async () => {
    try {
      const [c, r] = await Promise.all([
        AgentService.get(),
        AgentService.runs(15).catch(() => [] as AgentRun[]),
      ])
      aplicar(c)
      setRuns(r)
    } catch (error) {
      toast({
        title: "No se pudo cargar la configuración",
        description: error instanceof Error ? error.message : "Probá de nuevo",
        variant: "destructive",
      })
    } finally {
      setCargando(false)
    }
  }, [aplicar, toast])

  React.useEffect(() => {
    cargar()
  }, [cargar])

  const guardar = async () => {
    setGuardando(true)
    try {
      const c = await AgentService.guardar({
        claudeApiKey: keyNueva.trim() || undefined,
        modelo: modelo.trim(),
        maxTokens: Number(maxTokens) || 1024,
        systemPrompt,
        por: user?.email || undefined,
      })
      aplicar(c)
      toast({ title: "Configuración guardada", variant: "success" })
    } catch (error) {
      toast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "Probá de nuevo",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  const probar = async () => {
    setProbando(true)
    try {
      const r = await AgentService.probar(keyNueva.trim() || undefined, modelo.trim() || undefined)
      toast({
        title: r.ok ? "La key funciona" : "La key no funcionó",
        description: r.ok ? `Respondió ${r.modelo}` : r.mensaje,
        variant: r.ok ? "success" : "destructive",
      })
    } catch (error) {
      toast({
        title: "No se pudo probar",
        description: error instanceof Error ? error.message : "Probá de nuevo",
        variant: "destructive",
      })
    } finally {
      setProbando(false)
    }
  }

  const activar = async (valor: boolean) => {
    // Se guarda al toque, sin pasar por "Guardar cambios": prender o apagar el
    // agente es lo que alguien viene a hacer con apuro.
    setGuardando(true)
    try {
      const c = await AgentService.guardar({ activo: valor, por: user?.email || undefined })
      setConfig(c)
      toast({
        title: valor ? "Agente activado" : "Agente apagado",
        description: valor
          ? "Va a responder solo las conversaciones nuevas"
          : "Las conversaciones vuelven a los operadores",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "No se pudo cambiar el estado",
        description: error instanceof Error ? error.message : "Probá de nuevo",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  const borrarKey = async () => {
    setGuardando(true)
    try {
      const c = await AgentService.borrarKey(user?.email || undefined)
      aplicar(c)
      toast({ title: "API key borrada", description: "El agente quedó apagado", variant: "success" })
    } catch (error) {
      toast({
        title: "No se pudo borrar",
        description: error instanceof Error ? error.message : "Probá de nuevo",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  const tocar = (fn: () => void) => {
    fn()
    setSucio(true)
  }

  if (cargando) {
    return (
      <AdminShell title="Agente IA" description="Respuestas automáticas con Claude">
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </AdminShell>
    )
  }

  const faltantes = config?.faltantes ?? []
  const puedeActivar = Boolean(config?.listoParaActivar)

  return (
    <AdminShell
      title="Agente IA"
      description="Respuestas automáticas con Claude"
      actions={
        <Button size="sm" onClick={guardar} disabled={guardando || !sucio}>
          {guardando ? (
            <>
              <Spinner /> Guardando…
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      }
    >
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* ------------------------------------------------ interruptor */}
        <Card className="lg:col-span-3">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full border",
                  config?.activo
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    : "border-border bg-surface-2 text-subtle-foreground"
                )}
              >
                <Bot className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {config?.activo ? "El agente está respondiendo" : "El agente está apagado"}
                </p>
                <p className="mt-0.5 text-[13px] text-subtle-foreground">
                  {config?.activo
                    ? "Contesta solo. Si un operador escribe en una conversación, se calla 15 minutos en esa."
                    : "Las conversaciones las atienden los operadores, como hasta ahora."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!puedeActivar && !config?.activo && (
                <Badge className="gap-1.5">
                  <AlertTriangle className="size-3" /> Falta configurar
                </Badge>
              )}
              <Switch
                checked={Boolean(config?.activo)}
                onCheckedChange={activar}
                disabled={guardando || (!puedeActivar && !config?.activo)}
                aria-label="Activar el agente"
              />
            </div>
          </CardContent>
        </Card>

        {/* -------------------------------------------- lo que falta */}
        {faltantes.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5 lg:col-span-3">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-amber-500">
                  <ShieldAlert className="size-4" /> Falta configurar el servidor
                </CardTitle>
                <CardDescription>
                  Estas variables se cargan en Railway, no acá. Hasta que estén, el agente no puede
                  activarse.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {faltantes.map((v) => (
                <div key={v} className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <code className="text-[13px] font-medium">{v}</code>
                    <p className="text-[13px] text-subtle-foreground">
                      {EXPLICACION_FALTANTES[v] || "Variable de entorno pendiente."}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ------------------------------------------------ conexión */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-4" /> Conexión con Claude
              </CardTitle>
              <CardDescription>
                La API key de tu cuenta de Anthropic. Se guarda cifrada y no se puede volver a leer
                desde acá: si la perdés, cargás una nueva.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="claude-key">API key</Label>

              {config?.claudeKeyConfigurada && !cambiandoKey ? (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  <code className="text-[13px]">{config.claudeKeyPreview}</code>
                  <span className="text-[12px] text-subtle-foreground">
                    · cargada el {fecha(config.claudeKeyActualizadaEl)}
                  </span>
                  <div className="ml-auto flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setCambiandoKey(true)}>
                      Cambiar
                    </Button>
                    <Button variant="secondary" size="sm" onClick={borrarKey} disabled={guardando}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Input
                    id="claude-key"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="sk-ant-api03-…"
                    value={keyNueva}
                    onChange={(e) => tocar(() => setKeyNueva(e.target.value))}
                  />
                  <p className="text-[12px] text-subtle-foreground">
                    Se saca de console.anthropic.com. El consumo del agente se factura a esa cuenta.
                  </p>
                </>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="modelo">
                  <Cpu className="size-3.5" /> Modelo
                </Label>
                <Input
                  id="modelo"
                  spellCheck={false}
                  placeholder="claude-sonnet-4-5"
                  value={modelo}
                  onChange={(e) => tocar(() => setModelo(e.target.value))}
                />
                <p className="text-[12px] text-subtle-foreground">
                  El id exacto está en docs.claude.com. Probá la key para confirmar que existe.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max-tokens">Largo máximo de la respuesta</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min={128}
                  max={8192}
                  value={maxTokens}
                  onChange={(e) => tocar(() => setMaxTokens(e.target.value))}
                />
                <p className="text-[12px] text-subtle-foreground">
                  En tokens. 1024 alcanza de sobra para un mensaje de chat.
                </p>
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={probar} disabled={probando}>
              {probando ? (
                <>
                  <Spinner /> Probando…
                </>
              ) : (
                <>
                  <Zap className="size-3.5" /> Probar conexión
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ------------------------------------------------ actividad */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4" /> Últimos turnos
              </CardTitle>
              <CardDescription>Qué disparó al agente y qué hizo</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Todavía no hay actividad"
                description="Acá van a aparecer los turnos cuando el agente empiece a responder."
              />
            ) : (
              <ul className="space-y-3">
                {runs.map((r) => (
                  <li key={r.runId} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-[11px] font-medium uppercase", COLOR_ESTADO[r.estado])}>
                        {r.estado}
                      </span>
                      <span className="text-[11px] text-subtle-foreground">{fecha(r.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px]">{r.disparo || "—"}</p>
                    {r.ultimoError && (
                      <p className="mt-1 text-[12px] text-destructive">{r.ultimoError}</p>
                    )}
                    {r.acciones.length > 0 && (
                      <p className="mt-1 text-[12px] text-subtle-foreground">
                        {r.acciones.map((a) => a.tool).join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------------ instrucciones */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareText className="size-4" /> Cómo tiene que responder
                </CardTitle>
                <CardDescription>
                  Las instrucciones que lee el agente antes de cada conversación. Lo que digas acá
                  manda sobre cualquier cosa que escriba el jugador.
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => tocar(() => setSystemPrompt(config?.promptPorDefecto || ""))}
              >
                <RotateCcw className="size-3.5" /> Restaurar el texto por defecto
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              rows={16}
              spellCheck={false}
              className="font-mono text-[13px] leading-relaxed"
              value={systemPrompt}
              onChange={(e) => tocar(() => setSystemPrompt(e.target.value))}
            />
            <p className="text-[12px] text-subtle-foreground">
              Los textos de las respuestas aprobadas (los atajos de <code>/respuestas</code>) se le
              pasan aparte en cada turno: no hace falta copiarlos acá.
            </p>
          </CardContent>
        </Card>

        {config?.actualizadoEl && (
          <p className="text-[12px] text-subtle-foreground lg:col-span-3">
            <Power className="mr-1 inline size-3" />
            Última modificación: {fecha(config.actualizadoEl)}
            {config.actualizadoPor ? ` por ${config.actualizadoPor}` : ""}
          </p>
        )}
      </div>
    </AdminShell>
  )
}
