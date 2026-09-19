"use client"

import * as React from "react"
import { Pencil, Phone, Plus, Search, Tag, User, Users, X } from "lucide-react"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { AdminShell } from "@/components/admin/admin-shell"
import {
  CopyValue,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { ContactService } from "@/services/contacts-service"
import { Contact, CreateContactData, UpdateContactData } from "@/types/contact"

const FORM_VACIO = { source: "", phone: "", username: "", notes: "", tags: "" }

export default function ContactsPage() {
  const queryClient = useQueryClient()
  const [phoneFilter, setPhoneFilter] = React.useState("")
  const [usernameFilter, setUsernameFilter] = React.useState("")
  const [editando, setEditando] = React.useState<Contact | null>(null)
  const [abierto, setAbierto] = React.useState(false)
  const [formData, setFormData] = React.useState(FORM_VACIO)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["contacts", phoneFilter, usernameFilter],
    queryFn: ({ pageParam = 1 }) =>
      ContactService.getContacts(
        pageParam,
        25,
        phoneFilter || undefined,
        usernameFilter || undefined
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.currentPage + 1 : undefined,
    staleTime: 1000 * 60 * 5,
  })

  const cerrar = () => {
    setAbierto(false)
    setEditando(null)
    setFormData(FORM_VACIO)
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateContactData) => ContactService.createContact(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      toast({ title: "Contacto creado", variant: "success" })
      cerrar()
    },
    onError: (e: Error) =>
      toast({ title: "No se pudo crear", description: e.message, variant: "destructive" }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContactData }) =>
      ContactService.updateContact(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      toast({ title: "Contacto actualizado", variant: "success" })
      cerrar()
    },
    onError: (e: Error) =>
      toast({ title: "No se pudo actualizar", description: e.message, variant: "destructive" }),
  })

  const contactos = data?.pages.flatMap((p) => p.contacts) || []
  const total = data?.pages[0]?.pagination.totalCount ?? 0
  const hayFiltros = Boolean(phoneFilter || usernameFilter)
  const guardando = createMutation.isPending || updateMutation.isPending

  const abrirNuevo = () => {
    setEditando(null)
    setFormData(FORM_VACIO)
    setAbierto(true)
  }

  const abrirEdicion = (contacto: Contact) => {
    setEditando(contacto)
    setFormData({
      source: contacto.source || "",
      phone: contacto.phone || "",
      username: contacto.username || "",
      notes: contacto.notes || "",
      tags: contacto.tags || "",
    })
    setAbierto(true)
  }

  const guardar = () => {
    if (editando) {
      updateMutation.mutate({ id: editando._id, payload: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  return (
    <AdminShell
      title="Contactos"
      description={`${total.toLocaleString("es-AR")} jugadores en la base`}
      actions={
        <Button size="sm" onClick={abrirNuevo}>
          <Plus />
          <span className="hidden sm:inline">Nuevo contacto</span>
        </Button>
      }
    >
      <Card className="overflow-hidden p-0">
        <Toolbar>
          <Field label="Usuario" className="flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle-foreground" />
              <Input
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
                placeholder="buscar por usuario"
                className="h-8 pl-8"
              />
            </div>
          </Field>
          <Field label="Teléfono">
            <Input
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="54911…"
              className="num h-8 w-[10rem]"
            />
          </Field>
          {hayFiltros && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPhoneFilter("")
                setUsernameFilter("")
              }}
            >
              <X /> Limpiar
            </Button>
          )}
        </Toolbar>

        {isLoading ? (
          <LoadingRows rows={8} cols={5} />
        ) : error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : contactos.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No se encontraron contactos"
            description={hayFiltros ? "Probá con otro filtro." : "Creá el primero a mano o esperá a que entren por el chat."}
            action={
              <Button size="sm" onClick={abrirNuevo}>
                <Plus /> Nuevo contacto
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Alta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactos.map((contacto) => (
                  <TableRow key={contacto._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold uppercase text-muted-foreground">
                          {(contacto.username || contacto.phone || "??").slice(0, 2)}
                        </div>
                        <span className="font-medium">{contacto.username || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="num text-muted-foreground">
                      {contacto.phone ? (
                        <CopyValue value={contacto.phone}>{contacto.phone}</CopyValue>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {contacto.source ? (
                        <Badge variant="outline">{contacto.source}</Badge>
                      ) : (
                        <span className="text-subtle-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contacto.tags ? (
                        <div className="flex flex-wrap gap-1">
                          {contacto.tags
                            .split(",")
                            .filter((t) => t.trim())
                            .map((tag, i) => (
                              <Badge key={i} variant="secondary">
                                <Tag /> {tag.trim()}
                              </Badge>
                            ))}
                        </div>
                      ) : (
                        <span className="text-subtle-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="num text-[12px] text-subtle-foreground">
                      {contacto.createdAt ? formatDate(contacto.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title="Editar"
                        onClick={() => abrirEdicion(contacto)}
                      >
                        <Pencil />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {hasNextPage && (
              <div className="flex justify-center border-t border-border px-4 py-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Spinner /> Cargando…
                    </>
                  ) : (
                    "Cargar más contactos"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ------------------------------------------------------- formulario */}
      <Dialog open={abierto} onOpenChange={(v) => (v ? setAbierto(true) : cerrar())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
            <DialogDescription>
              {editando
                ? "Los cambios se aplican sobre el contacto existente."
                : "Se agrega a la base con el origen que indiques."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="username">
                <User className="size-3.5" /> Usuario
              </Label>
              <Input
                id="username"
                placeholder="NombreUsuario123"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                <Phone className="size-3.5" /> Teléfono
              </Label>
              <Input
                id="phone"
                placeholder="5491123456789"
                className="num"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Origen</Label>
              <Input
                id="source"
                placeholder="admin-invite"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">
                <Tag className="size-3.5" /> Tags
              </Label>
              <Input
                id="tags"
                placeholder="vip, premium"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Información adicional…"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={cerrar}>
              Cancelar
            </Button>
            <Button size="sm" onClick={guardar} disabled={guardando || !formData.phone.trim()}>
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
                  <Plus /> Crear contacto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
