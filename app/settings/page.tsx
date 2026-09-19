"use client"

import * as React from "react"
import Image from "next/image"
import {
  Camera,
  FileText,
  Link2,
  MessageCircle,
  Phone,
  Power,
  UserCheck,
} from "lucide-react"

import { AdminShell } from "@/components/admin/admin-shell"
import { Spinner } from "@/components/admin/kit"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { uploadImageToR2, UploadResult } from "@/lib/upload-cdn"

const CDN = process.env.NEXT_PUBLIC_PUBLIC_CDN_URL || ""

export default function SettingsPage() {
  const { toast } = useToast()
  const [profileImage, setProfileImage] = React.useState<string>("/logo.png")
  const [uploaded, setUploaded] = React.useState<UploadResult | null>(null)
  const [isConnected, setIsConnected] = React.useState(true)
  const [subiendo, setSubiendo] = React.useState(false)
  const [guardando, setGuardando] = React.useState(false)
  const [cargando, setCargando] = React.useState(true)
  const [sucio, setSucio] = React.useState(false)

  const [formData, setFormData] = React.useState({
    displayName: "",
    platformLink: "",
    description: "",
    welcomeMessage: "",
    phone: "",
  })

  const actualizar = (campo: string, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }))
    setSucio(true)
  }

  React.useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`)
        if (!res.ok) throw new Error(`Error al cargar configuración: ${res.status}`)
        const data = await res.json()

        if (data.profileImage) {
          setUploaded(data.profileImage)
          const url =
            data.profileImage.sizes?.original ||
            data.profileImage.sizes?.small ||
            data.profileImage.originalUrl
          setProfileImage(CDN ? CDN + url : "/logo.png")
        }
        setIsConnected(data.isConnected ?? true)
        setFormData({
          displayName: data.displayName || "",
          platformLink: data.platformLink || "",
          description: data.description || "",
          welcomeMessage: data.welcomeMessage || "",
          phone: data.phone || "",
        })
      } catch (error) {
        toast({
          title: "Error al cargar configuración",
          description: error instanceof Error ? error.message : "Se usan valores por defecto",
          variant: "destructive",
        })
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [toast])

  const cambiarImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setSubiendo(true)
      const reader = new FileReader()
      reader.onloadend = () => setProfileImage(reader.result as string)
      reader.readAsDataURL(file)

      const result = await uploadImageToR2(file)
      setUploaded(result)
      const url = result.sizes?.original || result.sizes?.small || result.originalUrl
      setProfileImage(CDN ? CDN + url : "/logo.png")
      setSucio(true)
    } catch (error) {
      toast({
        title: "Error al subir imagen",
        description: error instanceof Error ? error.message : "Intentá de nuevo",
        variant: "destructive",
      })
      setProfileImage("/logo.png")
    } finally {
      setSubiendo(false)
    }
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileImage: uploaded
            ? {
                filename: uploaded.filename,
                originalUrl: uploaded.originalUrl,
                sizes: uploaded.sizes,
              }
            : null,
          isConnected,
          ...formData,
          timestamp: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error(`Error al guardar configuración: ${res.status}`)
      setSucio(false)
      toast({ title: "Configuración guardada", variant: "success" })
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <AdminShell
      title="Ajustes"
      description="Cómo se ve el chat del lado del jugador"
      actions={
        <Button size="sm" onClick={guardar} disabled={guardando || subiendo || cargando}>
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
      {cargando ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-60 lg:col-span-1" />
          <Skeleton className="h-60 lg:col-span-2" />
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {/* ------------------------------------------------------ perfil */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div>
                <CardTitle>Identidad</CardTitle>
                <CardDescription>Logo y nombre que ve el jugador</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="group relative size-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface-2">
                  <Image
                    src={profileImage || "/logo.png"}
                    alt="Logo"
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                  <label
                    htmlFor="profile-photo"
                    className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Camera className="size-5 text-white" />
                  </label>
                  {subiendo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Spinner className="text-primary" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => document.getElementById("profile-photo")?.click()}
                    disabled={subiendo}
                  >
                    <Camera /> {subiendo ? "Subiendo…" : "Cambiar foto"}
                  </Button>
                  <p className="mt-1.5 text-[11px] text-subtle-foreground">
                    JPG, PNG o GIF · máx. 5MB
                  </p>
                </div>
                <input
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={cambiarImagen}
                  disabled={subiendo}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="display-name">
                  <UserCheck className="size-3.5" /> Nombre a mostrar
                </Label>
                <Input
                  id="display-name"
                  placeholder="Atlantics Developers"
                  value={formData.displayName}
                  onChange={(e) => actualizar("displayName", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">
                  <FileText className="size-3.5" /> Descripción
                </Label>
                <Textarea
                  id="description"
                  rows={2}
                  placeholder="Describí tu negocio…"
                  value={formData.description}
                  onChange={(e) => actualizar("description", e.target.value)}
                />
                <p className="text-[11px] text-subtle-foreground">Máximo 200 caracteres</p>
              </div>
            </CardContent>
          </Card>

          {/* --------------------------------------------------- operación */}
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Conversación</CardTitle>
                  <CardDescription>Bienvenida y disponibilidad del chat</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="welcome-message">
                    <MessageCircle className="size-3.5" /> Mensaje de bienvenida
                  </Label>
                  <Textarea
                    id="welcome-message"
                    rows={3}
                    placeholder="Lo primero que ve el jugador al abrir el chat…"
                    value={formData.welcomeMessage}
                    onChange={(e) => actualizar("welcomeMessage", e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2/40 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Power
                      className={`size-4 ${isConnected ? "text-primary" : "text-subtle-foreground"}`}
                    />
                    <div>
                      <p className="text-[13px] font-medium">
                        {isConnected ? "Conectado" : "Desconectado"}
                      </p>
                      <p className="text-[12px] text-subtle-foreground">
                        Define el estado que se muestra en el encabezado del chat
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isConnected}
                    onCheckedChange={(v) => {
                      setIsConnected(v)
                      setSucio(true)
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Contacto y plataforma</CardTitle>
                  <CardDescription>Datos que usa el chat para derivar al jugador</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="platform-link">
                    <Link2 className="size-3.5" /> Enlace a plataforma
                  </Label>
                  <Input
                    id="platform-link"
                    type="url"
                    placeholder="https://atlantics.dev"
                    value={formData.platformLink}
                    onChange={(e) => actualizar("platformLink", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    <Phone className="size-3.5" /> Teléfono
                  </Label>
                  <Input
                    id="phone"
                    className="num"
                    placeholder="1123456789"
                    value={formData.phone}
                    onChange={(e) => actualizar("phone", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {sucio && (
              <div className="flex items-center justify-between rounded-lg border border-warning/35 bg-warning/8 px-4 py-3">
                <p className="text-[13px] text-warning">Hay cambios sin guardar.</p>
                <Button size="sm" onClick={guardar} disabled={guardando || subiendo}>
                  {guardando ? (
                    <>
                      <Spinner /> Guardando…
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  )
}
