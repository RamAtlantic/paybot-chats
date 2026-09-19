"use client"

import * as React from "react"
import Image from "next/image"
import {
  ImageIcon,
  Pencil,
  Plus,
  Power,
  Search,
  Type,
  Upload,
  X,
  Zap,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { AdminShell } from "@/components/admin/admin-shell"
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingRows,
  Spinner,
  Toolbar,
} from "@/components/admin/kit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { uploadImageToR2 } from "@/lib/upload-cdn"
import { cn } from "@/lib/utils"
import {
  CreateResponseData,
  ResponseData,
  ResponsesService,
  UpdateResponseData,
} from "@/services/responses-service"

type ResponseType = "text" | "image" | "mixed" | "automation"
type FiltroTipo = "todos" | "text" | "image" | "automation"
type FiltroEstado = "todos" | "activas" | "inactivas"

const FORM_VACIO = {
  atajo: "",
  text: "",
  image: "",
  type: "text" as ResponseType,
  status: true,
  triggers: [] as string[],
}

function TipoBadge({ type }: { type: ResponseType }) {
  if (type === "automation")
    return (
      <Badge variant="default">
        <Zap /> automation
      </Badge>
    )
  if (type === "image")
    return (
      <Badge variant="info">
        <ImageIcon /> imagen
      </Badge>
    )
  return (
    <Badge variant="secondary">
      <Type /> texto
    </Badge>
  )
}

export default function ResponsesPage() {
  const queryClient = useQueryClient()
  const [busqueda, setBusqueda] = React.useState("")
  const [tipo, setTipo] = React.useState<FiltroTipo>("todos")
  const [estado, setEstado] = React.useState<FiltroEstado>("todos")
  const [abierto, setAbierto] = React.useState(false)
  const [editando, setEditando] = React.useState<ResponseData | null>(null)
  const [formData, setFormData] = React.useState(FORM_VACIO)
  const [triggerActual, setTriggerActual] = React.useState("")
  const [subiendo, setSubiendo] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const { data: responses = [], isLoading, error, refetch } = useQuery({
    queryKey: ["responses"],
    queryFn: () => ResponsesService.getResponses(),
    staleTime: 1000 * 60 * 5,
  })

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["responses"] })

  const createMutation = useMutation({
    mutationFn: (payload: CreateResponseData) => ResponsesService.createResponse(payload),
    onSuccess: () => {
      invalidar()
      toast({ title: "Respuesta creada", variant: "success" })
      cerrar()
    },
    onError: (e: Error) =>
      toast({ title: "No se pudo crear", description: e.message, variant: "destructive" }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateResponseData }) =>
      ResponsesService.updateResponse(id, payload),
    onSuccess: () => invalidar(),
    onError: (e: Error) =>
      toast({ title: "No se pudo actualizar", description: e.message, variant: "destructive" }),
  })

  const cerrar = () => {
    setAbierto(false)
    setEditando(null)
    setFormData(FORM_VACIO)
    setTriggerActual("")
  }

  const abrirNueva = () => {
    setEditando(null)
    setFormData(FORM_VACIO)
    setAbierto(true)
  }

  const abrirEdicion = (r: ResponseData) => {
    setEditando(r)
    setFormData({
      atajo: r.atajo,
      text: r.text || "",
      image: r.image || "",
      type: r.type,
      status: r.status,
      triggers: [...(r.triggers || [])],
    })
    setTriggerActual("")
    setAbierto(true)
  }

  const guardar = async () => {
    const esAutomation = formData.type === "automation"
    if (editando) {
      const payload: UpdateResponseData = {
        atajo: formData.atajo,
        text: formData.text,
        image: formData.image,
        status: formData.status,
        triggers: formData.triggers,
      }
      if (!esAutomation) payload.type = formData.type as "text" | "image" | "mixed"
      await updateMutation.mutateAsync({ id: editando._id, payload })
      toast({ title: "Respuesta actualizada", variant: "success" })
      cerrar()
    } else {
      await createMutation.mutateAsync({
        atajo: formData.atajo,
        text: formData.text,
        image: formData.image,
        type: formData.type as "text" | "image" | "mixed",
        status: formData.status,
        triggers: formData.triggers,
      })
    }
  }

  const toggleStatus = (r: ResponseData, status: boolean) =>
    updateMutation.mutate({ id: r._id, payload: { status } })

  const agregarTrigger = () => {
    const t = triggerActual.trim()
    if (!t || formData.triggers.includes(t)) return
    setFormData({ ...formData, triggers: [...formData.triggers, t] })
    setTriggerActual("")
  }

  const subirImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ title: "Archivo inválido", description: "Tiene que ser una imagen", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagen muy pesada", description: "Máximo 5MB", variant: "destructive" })
      return
    }
    try {
      setSubiendo(true)
      const result = await uploadImageToR2(file)
      setFormData((prev) => ({
        ...prev,
        image: `${process.env.NEXT_PUBLIC_PUBLIC_CDN_URL || ""}${result.originalUrl}`,
      }))
      toast({ title: "Imagen subida", variant: "success" })
    } catch (err) {
      toast({
        title: "Error al subir",
        description: err instanceof Error ? err.message : "Intentá de nuevo",
        variant: "destructive",
      })
    } finally {
      setSubiendo(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const filtradas = responses.filter((r) => {
    const texto = `${r.atajo} ${r.text || ""} ${(r.triggers || []).join(" ")}`.toLowerCase()
    if (busqueda && !texto.includes(busqueda.toLowerCase())) return false
    if (tipo !== "todos" && r.type !== tipo) return false
    if (estado === "activas" && !r.status) return false
    if (estado === "inactivas" && r.status) return false
    return true
  })

  const activas = responses.filter((r) => r.status).length
  const automations = responses.filter((r) => r.type === "automation").length
  const guardando = createMutation.isPending || updateMutation.isPending

  return (
    <AdminShell
      title="Respuestas"
      description={`${responses.length} atajos · ${activas} activos · ${automations} automations`}
      actions={
        <Button size="sm" onClick={abrirNueva}>
          <Plus />
          <span className="hidden sm:inline">Nueva respuesta</span>
        </Button>
      }
    >
      <Card className="overflow-hidden p-0">
        <Toolbar>
          <Field label="Buscar" className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle-foreground" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="atajo, texto o trigger"
                className="h-8 pl-8"
              />
            </div>
          </Field>
          <Field label="Tipo">
            <Select value={tipo} onValueChange={(v) => setTipo(v as FiltroTipo)}>
              <SelectTrigger size="sm" className="w-[9rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="image">Imagen</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estado">
            <Select value={estado} onValueChange={(v) => setEstado(v as FiltroEstado)}>
              <SelectTrigger size="sm" className="w-[8.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activas">Activas</SelectItem>
                <SelectItem value="inactivas">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Toolbar>

        {isLoading ? (
          <LoadingRows rows={8} cols={5} />
        ) : error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : filtradas.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No hay respuestas con ese filtro"
            action={
              <Button size="sm" onClick={abrirNueva}>
                <Plus /> Nueva respuesta
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Atajo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[32%]">Contenido</TableHead>
                <TableHead>Triggers</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Activa</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((r) => (
                <TableRow key={r._id} className={cn(!r.status && "opacity-60")}>
                  <TableCell className="font-mono text-[12.5px] font-medium">
                    <span className="text-subtle-foreground">/</span>
                    {r.atajo}
                  </TableCell>
                  <TableCell>
                    <TipoBadge type={r.type} />
                  </TableCell>
                  <TableCell className="max-w-0">
                    {r.type === "image" && r.image ? (
                      <div className="flex items-center gap-2">
                        <Image
                          src={r.image}
                          alt=""
                          width={36}
                          height={28}
                          className="rounded border border-border object-cover"
                          unoptimized
                        />
                        <span className="truncate text-[12px] text-subtle-foreground">imagen</span>
                      </div>
                    ) : (
                      <span className="block truncate text-muted-foreground">
                        {r.text || "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[14rem]">
                    <div className="flex flex-wrap gap-1">
                      {(r.triggers || []).slice(0, 3).map((t, i) => (
                        <Badge key={i} variant="outline">
                          {t}
                        </Badge>
                      ))}
                      {(r.triggers || []).length > 3 && (
                        <Badge variant="outline">+{r.triggers.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-subtle-foreground">
                    {r.funnel?.etapa || "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={r.status}
                      onCheckedChange={(checked) => toggleStatus(r, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="Editar"
                      onClick={() => abrirEdicion(r)}
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* -------------------------------------------------------- formulario */}
      <Dialog open={abierto} onOpenChange={(v) => (v ? setAbierto(true) : cerrar())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editando ? "Editar respuesta" : "Nueva respuesta"}
              {formData.type === "automation" && (
                <Badge variant="default">
                  <Zap /> automation
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="atajo">Atajo</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-subtle-foreground">
                  /
                </span>
                <Input
                  id="atajo"
                  placeholder="datos-pago"
                  className="pl-6 font-mono"
                  value={formData.atajo}
                  onChange={(e) =>
                    setFormData({ ...formData, atajo: e.target.value.replace(/^\//, "") })
                  }
                />
              </div>
              <p className="text-[11px] text-subtle-foreground">
                El operador lo dispara escribiendo “/” en el chat
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              {formData.type === "automation" ? (
                <div className="flex h-9 items-center rounded-md border border-border bg-surface-2/40 px-3 text-[13px] text-muted-foreground">
                  Entrega automática de cuenta
                </div>
              ) : (
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as ResponseType })}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="image">Imagen</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* triggers */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Triggers</Label>
              {formData.triggers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {formData.triggers.map((t) => (
                    <Badge key={t} variant="default" className="pr-1">
                      {t}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            triggers: formData.triggers.filter((x) => x !== t),
                          })
                        }
                        className="ml-0.5 rounded-[4px] p-0.5 transition-colors hover:bg-primary/25"
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="palabra clave + Enter"
                  value={triggerActual}
                  onChange={(e) => setTriggerActual(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      agregarTrigger()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={agregarTrigger}
                  disabled={!triggerActual.trim()}
                >
                  <Plus />
                </Button>
              </div>
            </div>

            {/* contenido */}
            {formData.type === "image" ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>Imagen</Label>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                      disabled={subiendo}
                    >
                      {subiendo ? (
                        <>
                          <Spinner /> Subiendo…
                        </>
                      ) : (
                        <>
                          <Upload /> Seleccionar imagen
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-subtle-foreground">JPG, PNG, GIF o WebP · 5MB</p>
                  </div>
                  {formData.image && (
                    <div className="relative">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        width={200}
                        height={120}
                        className="rounded-md border border-border object-cover"
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="absolute right-1 top-1 bg-background/80 hover:text-danger"
                        onClick={() => setFormData({ ...formData, image: "" })}
                      >
                        <X />
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={subirImagen}
                />
              </div>
            ) : (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="text">
                  {formData.type === "automation" ? "Mensaje que acompaña la entrega" : "Texto"}
                </Label>
                <Textarea
                  id="text"
                  rows={6}
                  placeholder="Escribí la respuesta…"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                />
              </div>
            )}

            {/* estado */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2/40 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Power
                    className={cn(
                      "size-4",
                      formData.status ? "text-primary" : "text-subtle-foreground"
                    )}
                  />
                  <div>
                    <p className="text-[13px] font-medium">
                      {formData.status ? "Activa" : "Inactiva"}
                    </p>
                    <p className="text-[12px] text-subtle-foreground">
                      Solo las activas aparecen en el selector del chat
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.status}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={cerrar}>
              Cancelar
            </Button>
            <Button size="sm" onClick={guardar} disabled={guardando || !formData.atajo.trim()}>
              {guardando ? (
                <>
                  <Spinner /> Guardando…
                </>
              ) : editando ? (
                <>
                  <Pencil /> Guardar cambios
                </>
              ) : (
                <>
                  <Plus /> Crear respuesta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
