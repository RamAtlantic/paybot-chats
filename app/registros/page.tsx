"use client"

import * as React from "react"
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  IdCard,
  RefreshCw,
  Search,
  Undo2,
  Upload,
  X,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AdminShell } from "@/components/admin/admin-shell"
import {
  CopyValue,
  EmptyState,
  ErrorState,
  Field,
  LoadingRows,
  Pagination,
  Section,
  Spinner,
  StatCard,
  StatusDot,
  Toolbar,
} from "@/components/admin/kit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-provider"
import { cn } from "@/lib/utils"
import {
  AccountsService,
  AccountStatus,
  ImportSummary,
  PlatformAccount,
} from "@/services/accounts-service"

const TODAS = "__todas__"
const TODOS = "__todos__"

function fecha(valor?: string | null) {
  if (!valor) return "—"
  const d = new Date(valor)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function EstadoBadge({ status }: { status: AccountStatus }) {
  if (status === "disponible") return <Badge variant="success">open</Badge>
  if (status === "entregado") return <Badge variant="info">entregado</Badge>
  return <Badge variant="danger">anulado</Badge>
}

export default function RegistrosPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [umbral, setUmbral] = React.useState(10)
  const [plataforma, setPlataforma] = React.useState("")
  const [status, setStatus] = React.useState<AccountStatus | "">("")
  const [usuario, setUsuario] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [verPasswords, setVerPasswords] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)

  const stockQuery = useQuery({
    queryKey: ["accounts-stock", umbral],
    queryFn: () => AccountsService.getStock(umbral),
    refetchInterval: 60_000,
  })

  const listQuery = useQuery({
    queryKey: ["accounts-list", plataforma, status, usuario, phone, page, verPasswords],
    queryFn: () =>
      AccountsService.list({
        plataforma,
        status,
        usuario,
        phone,
        page,
        limit: 25,
        includePassword: verPasswords,
      }),
  })

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ["accounts-stock"] })
    queryClient.invalidateQueries({ queryKey: ["accounts-list"] })
  }

  const releaseMutation = useMutation({
    mutationFn: (cuenta: PlatformAccount) =>
      AccountsService.release(cuenta._id, "liberada desde el panel", user?.email || undefined),
    onSuccess: () => {
      refrescar()
      toast({
        title: "Cuenta liberada",
        description: "Volvió al pool como disponible.",
        variant: "success",
      })
    },
    onError: (error: Error) =>
      toast({ title: "No se pudo liberar", description: error.message, variant: "destructive" }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ cuenta, nuevo }: { cuenta: PlatformAccount; nuevo: AccountStatus }) =>
      AccountsService.update(cuenta._id, { status: nuevo }),
    onSuccess: () => {
      refrescar()
      toast({ title: "Estado actualizado", variant: "success" })
    },
    onError: (error: Error) =>
      toast({ title: "No se pudo actualizar", description: error.message, variant: "destructive" }),
  })

  const stock = stockQuery.data
  const cuentas = listQuery.data?.accounts || []
  const paginacion = listQuery.data?.pagination
  const enAlerta = (stock?.plataformas || []).filter((p) => p.sinStock || p.stockBajo)
  const hayFiltros = Boolean(plataforma || status || usuario || phone)

  const limpiarFiltros = () => {
    setPlataforma("")
    setStatus("")
    setUsuario("")
    setPhone("")
    setPage(1)
  }

  return (
    <AdminShell
      title="Registros"
      description="Pool de cuentas precargadas que el chat entrega solo"
      actions={
        <>
          <Button variant="ghost" size="icon-sm" onClick={refrescar} title="Actualizar">
            <RefreshCw className={cn(stockQuery.isFetching && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={() => setImportOpen(true)}>
            <Upload />
            <span className="hidden sm:inline">Importar Excel</span>
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        {/* ------------------------------------------------------------ kpis */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Disponibles"
            value={stock?.totales.disponible ?? 0}
            hint="listas para entregar"
            tone={(stock?.totales.disponible ?? 0) > 0 ? "primary" : "danger"}
            loading={stockQuery.isLoading}
          />
          <StatCard
            label="Entregadas"
            value={stock?.totales.entregado ?? 0}
            hint="asignadas a un chat"
            loading={stockQuery.isLoading}
          />
          <StatCard
            label="Anuladas"
            value={stock?.totales.anulado ?? 0}
            hint="fuera del pool"
            loading={stockQuery.isLoading}
          />
          <StatCard
            label="Plataformas en alerta"
            value={enAlerta.length}
            hint={`umbral: ${umbral} cuentas`}
            tone={enAlerta.length ? "warning" : "neutral"}
            loading={stockQuery.isLoading}
          />
        </div>

        {/* ----------------------------------------------------------- stock */}
        <Section
          title="Stock por plataforma"
          actions={
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-subtle-foreground">Avisar bajo</span>
              <Input
                type="number"
                min={0}
                value={umbral}
                onChange={(e) => setUmbral(Number(e.target.value) || 0)}
                className="num h-8 w-16 text-center"
              />
            </div>
          }
        >
          {stockQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg border border-border skeleton" />
              ))}
            </div>
          ) : stock && stock.plataformas.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stock.plataformas.map((p) => {
                const pct = p.total ? Math.round((p.disponible / p.total) * 100) : 0
                return (
                  <button
                    key={p.plataforma}
                    onClick={() => {
                      setPlataforma(p.plataforma)
                      setPage(1)
                    }}
                    className={cn(
                      "hairline rounded-lg border bg-card px-4 py-3.5 text-left transition-colors hover:bg-surface-2/50",
                      p.sinStock
                        ? "border-danger/45"
                        : p.stockBajo
                        ? "border-warning/45"
                        : "border-border hover:border-border-strong",
                      plataforma === p.plataforma && "ring-1 ring-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <StatusDot
                          tone={p.sinStock ? "danger" : p.stockBajo ? "warning" : "success"}
                        />
                        <span className="truncate text-[13px] font-medium">{p.plataforma}</span>
                      </span>
                      {p.sinStock ? (
                        <Badge variant="danger">sin stock</Badge>
                      ) : p.stockBajo ? (
                        <Badge variant="warning">bajo</Badge>
                      ) : null}
                    </div>
                    <div className="num mt-2 flex items-baseline gap-1.5">
                      <span
                        className={cn(
                          "text-2xl font-semibold leading-none",
                          p.sinStock ? "text-danger" : p.stockBajo ? "text-warning" : "text-primary"
                        )}
                      >
                        {p.disponible}
                      </span>
                      <span className="text-[12px] text-subtle-foreground">/ {p.total}</span>
                    </div>
                    <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-surface-3">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          p.sinStock ? "bg-danger" : p.stockBajo ? "bg-warning" : "bg-primary"
                        )}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <p className="num mt-2 text-[11px] text-subtle-foreground">
                      {p.entregado} entregadas · {p.anulado} anuladas
                    </p>
                  </button>
                )
              })}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={FileSpreadsheet}
                title="Todavía no hay cuentas cargadas"
                description="Importá el Excel con las columnas operador, panel, usuario, password, fecha y hora de registro, plataforma y status."
                action={
                  <Button size="sm" onClick={() => setImportOpen(true)}>
                    <Upload /> Importar Excel
                  </Button>
                }
              />
            </Card>
          )}
        </Section>

        {/* --------------------------------------------------------- listado */}
        <Section title="Cuentas">
          <Card className="overflow-hidden p-0">
            <Toolbar>
              <Field label="Plataforma">
                <Select
                  value={plataforma || TODAS}
                  onValueChange={(v) => {
                    setPlataforma(v === TODAS ? "" : v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger size="sm" className="w-[10rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODAS}>Todas</SelectItem>
                    {(stock?.plataformas || []).map((p) => (
                      <SelectItem key={p.plataforma} value={p.plataforma}>
                        {p.plataforma}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Estado">
                <Select
                  value={status || TODOS}
                  onValueChange={(v) => {
                    setStatus(v === TODOS ? "" : (v as AccountStatus))
                    setPage(1)
                  }}
                >
                  <SelectTrigger size="sm" className="w-[9.5rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Todos</SelectItem>
                    <SelectItem value="disponible">open (disponible)</SelectItem>
                    <SelectItem value="entregado">entregado</SelectItem>
                    <SelectItem value="anulado">anulado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Usuario" className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle-foreground" />
                  <Input
                    value={usuario}
                    onChange={(e) => {
                      setUsuario(e.target.value)
                      setPage(1)
                    }}
                    placeholder="buscar usuario"
                    className="h-8 pl-8"
                  />
                </div>
              </Field>

              <Field label="Teléfono">
                <Input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setPage(1)
                  }}
                  placeholder="54911…"
                  className="num h-8 w-[9rem]"
                />
              </Field>

              <div className="ml-auto flex items-center gap-2">
                {hayFiltros && (
                  <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                    <X /> Limpiar
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setVerPasswords((v) => !v)}
                  title="Mostrar u ocultar contraseñas"
                >
                  {verPasswords ? <EyeOff /> : <Eye />}
                  <span className="hidden lg:inline">
                    {verPasswords ? "Ocultar claves" : "Ver claves"}
                  </span>
                </Button>
              </div>
            </Toolbar>

            {listQuery.isLoading ? (
              <LoadingRows rows={8} cols={6} />
            ) : listQuery.isError ? (
              <ErrorState
                message={(listQuery.error as Error).message}
                onRetry={() => listQuery.refetch()}
              />
            ) : cuentas.length === 0 ? (
              <EmptyState
                icon={IdCard}
                title="No hay cuentas con esos filtros"
                description={hayFiltros ? "Probá limpiando los filtros." : undefined}
                action={
                  hayFiltros ? (
                    <Button variant="secondary" size="sm" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Usuario</TableHead>
                    {verPasswords && <TableHead>Contraseña</TableHead>}
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Panel</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Entregada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentas.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">
                        <CopyValue value={c.usuario}>{c.usuario}</CopyValue>
                      </TableCell>
                      {verPasswords && (
                        <TableCell className="font-mono text-[12px] text-muted-foreground">
                          {c.password ? <CopyValue value={c.password}>{c.password}</CopyValue> : "—"}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline">{c.plataforma}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.panel || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.operador || "—"}</TableCell>
                      <TableCell>
                        <EstadoBadge status={c.status} />
                      </TableCell>
                      <TableCell className="num text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell className="num text-[12px] text-subtle-foreground">
                        {fecha(c.deliveredAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === "entregado" && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title="Liberar: vuelve al pool"
                              onClick={() => releaseMutation.mutate(c)}
                              disabled={releaseMutation.isPending}
                            >
                              <Undo2 />
                            </Button>
                          )}
                          {c.status !== "anulado" ? (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title="Anular"
                              className="hover:text-danger"
                              onClick={() => statusMutation.mutate({ cuenta: c, nuevo: "anulado" })}
                              disabled={statusMutation.isPending}
                            >
                              <Ban />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title="Reactivar"
                              className="hover:text-primary"
                              onClick={() =>
                                statusMutation.mutate({ cuenta: c, nuevo: "disponible" })
                              }
                              disabled={statusMutation.isPending}
                            >
                              <CheckCircle2 />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {paginacion && paginacion.totalPages > 1 && (
              <Pagination
                page={paginacion.currentPage}
                totalPages={paginacion.totalPages}
                totalCount={paginacion.totalCount}
                hasPrev={paginacion.hasPrevPage}
                hasNext={paginacion.hasNextPage}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => p + 1)}
                unit="cuentas"
              />
            )}
          </Card>
        </Section>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        operador={user?.email || undefined}
        onDone={refrescar}
      />
    </AdminShell>
  )
}

/* ------------------------------------------------------------ importación */

function ImportDialog({
  open,
  onOpenChange,
  operador,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  operador?: string
  onDone: () => void
}) {
  const [archivo, setArchivo] = React.useState<File | null>(null)
  const [resumen, setResumen] = React.useState<ImportSummary | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const importMutation = useMutation({
    mutationFn: (file: File) => AccountsService.importFile(file, operador),
    onSuccess: (data) => {
      setResumen(data)
      setArchivo(null)
      onDone()
      toast({
        title: `${data.insertados} cuentas nuevas`,
        description:
          data.duplicadosEnBase.length || data.duplicadosEnArchivo.length || data.errores.length
            ? `${data.duplicadosEnBase.length + data.duplicadosEnArchivo.length} duplicadas · ${
                data.errores.length
              } con error`
            : "Sin duplicados ni errores",
        variant: "success",
      })
    },
    onError: (error: Error) =>
      toast({ title: "No se pudo importar", description: error.message, variant: "destructive" }),
  })

  const elegir = (file?: File | null) => {
    if (!file) return
    setArchivo(file)
    setResumen(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          setArchivo(null)
          setResumen(null)
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar cuentas</DialogTitle>
          <DialogDescription>
            Columnas requeridas, en cualquier orden:{" "}
            <span className="text-foreground">
              operador, panel, usuario, password, fecha y hora de registro, plataforma, status
            </span>
            . El status vacío se toma como <span className="text-foreground">open</span> y las filas
            repetidas se ignoran, así que podés reimportar el mismo archivo sin duplicar nada.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            elegir(e.dataTransfer.files?.[0])
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
            dragging
              ? "border-primary bg-primary/8"
              : "border-border-strong bg-surface-2/40 hover:border-primary/50"
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface-2">
            <FileSpreadsheet className="size-4 text-primary" />
          </div>
          {archivo ? (
            <>
              <p className="text-[13px] font-medium">{archivo.name}</p>
              <p className="text-[12px] text-subtle-foreground">
                {(archivo.size / 1024).toFixed(0)} KB · clic para cambiar
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-medium">Arrastrá el archivo acá</p>
              <p className="text-[12px] text-subtle-foreground">.xlsx o .csv — o hacé clic para elegirlo</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="hidden"
            onChange={(e) => elegir(e.target.files?.[0])}
          />
        </div>

        {resumen && (
          <div className="space-y-3 rounded-lg border border-border bg-surface-2/40 p-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <ResumenItem valor={resumen.insertados} label="nuevas" tone="text-primary" />
              <ResumenItem
                valor={resumen.duplicadosEnBase.length + resumen.duplicadosEnArchivo.length}
                label="duplicadas"
                tone="text-info"
              />
              <ResumenItem valor={resumen.errores.length} label="con error" tone="text-danger" />
              <ResumenItem valor={resumen.totalFilas} label="filas leídas" />
            </div>

            {resumen.errores.length > 0 && (
              <div className="space-y-1.5 border-t border-border pt-3">
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-warning">
                  <AlertTriangle className="size-3.5" /> Filas que no entraron
                </p>
                <ul className="custom-scrollbar max-h-40 space-y-1 overflow-y-auto text-[12px] text-subtle-foreground">
                  {resumen.errores.map((e, i) => (
                    <li key={i} className="num">
                      Fila {e.fila}: {e.motivo}
                      {e.usuario ? ` (${e.usuario})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            {resumen ? "Cerrar" : "Cancelar"}
          </Button>
          <Button
            size="sm"
            onClick={() => archivo && importMutation.mutate(archivo)}
            disabled={!archivo || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Spinner /> Importando…
              </>
            ) : (
              <>
                <Download /> Importar cuentas
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResumenItem({
  valor,
  label,
  tone,
}: {
  valor: number
  label: string
  tone?: string
}) {
  return (
    <div>
      <div className={cn("num text-xl font-semibold leading-none", tone)}>{valor}</div>
      <div className="mt-1 text-[11px] text-subtle-foreground">{label}</div>
    </div>
  )
}
