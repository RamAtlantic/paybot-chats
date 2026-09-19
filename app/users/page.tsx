"use client"

import * as React from "react"
import { Info, Mail, MessageCircle, Phone, Settings, UserPlus, Users, Zap } from "lucide-react"

import { AdminShell } from "@/components/admin/admin-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

const PERMISOS = [
  { id: "chats", label: "Acceso a chats", description: "Ver y responder conversaciones", icon: MessageCircle },
  { id: "contactos", label: "Administrar contactos", description: "Crear y editar la base", icon: Users },
  { id: "respuestas", label: "Respuestas automáticas", description: "Atajos y automations", icon: Zap },
  { id: "settings", label: "Configuración", description: "Perfil público del chat", icon: Settings },
] as const

type PermisoId = (typeof PERMISOS)[number]["id"]

export default function UsuariosPage() {
  const [permisos, setPermisos] = React.useState<Record<PermisoId, boolean>>({
    chats: true,
    contactos: false,
    respuestas: false,
    settings: false,
  })

  const [form, setForm] = React.useState({
    username: "",
    email: "",
    password: "",
    phone: "",
  })

  const limpiar = () =>
    setForm({ username: "", email: "", password: "", phone: "" })

  return (
    <AdminShell title="Usuarios" description="Operadores del panel y sus permisos">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="flex items-start gap-2.5 rounded-lg border border-info/30 bg-info/8 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-info" />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            El alta de operadores todavía se hace desde Firebase Auth. Este formulario deja
            preparada la pantalla: cuando la API exponga el endpoint de usuarios, queda conectada
            sin rehacer la UI.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="size-4 text-primary" /> Nuevo operador
              </CardTitle>
              <CardDescription>Credenciales de acceso al panel</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  placeholder="operador.nombre"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <p className="text-[11px] text-subtle-foreground">Mínimo 8 caracteres</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  <Mail className="size-3.5" /> Correo
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@atlantics.dev"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  <Phone className="size-3.5" /> Teléfono
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className="num"
                  placeholder="+54 9 11 1234-5678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permisos de acceso</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {PERMISOS.map((permiso) => {
                  const Icon = permiso.icon
                  const activo = permisos[permiso.id]
                  return (
                    <label
                      key={permiso.id}
                      htmlFor={permiso.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors ${
                        activo
                          ? "border-primary/40 bg-primary/8"
                          : "border-border bg-surface-2/30 hover:border-border-strong"
                      }`}
                    >
                      <Checkbox
                        id={permiso.id}
                        checked={activo}
                        onCheckedChange={() =>
                          setPermisos((prev) => ({ ...prev, [permiso.id]: !prev[permiso.id] }))
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-[13px] font-medium">
                          <Icon className="size-3.5 text-primary" />
                          {permiso.label}
                        </p>
                        <p className="mt-0.5 text-[12px] text-subtle-foreground">
                          {permiso.description}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
            <Button variant="secondary" size="sm" onClick={limpiar}>
              Limpiar
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast({
                  title: "Falta el endpoint de usuarios",
                  description: "La API todavía no expone el alta de operadores.",
                })
              }
            >
              <UserPlus /> Crear operador
            </Button>
          </div>
        </Card>
      </div>
    </AdminShell>
  )
}
