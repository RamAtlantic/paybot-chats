"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, LogIn } from "lucide-react"

import { useAuth } from "@/context/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingsService } from "@/services/settings-service"

const CDN = process.env.NEXT_PUBLIC_PUBLIC_CDN_URL || ""

export default function LoginPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [logo, setLogo] = React.useState("/logo.png")
  const [nombre, setNombre] = React.useState("Chat externo")
  const { login, user } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (user) router.push("/")
  }, [user, router])

  React.useEffect(() => {
    SettingsService.getSettings()
      .then((data) => {
        if (data.displayName) setNombre(data.displayName)
        if (data.profileImage) {
          const url =
            data.profileImage.sizes?.original ||
            data.profileImage.sizes?.small ||
            data.profileImage.originalUrl
          if (CDN && url) setLogo(CDN + url)
        }
      })
      .catch(() => {
        /* se queda el logo por defecto */
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await login(email, password)
    } catch {
      setError("Credenciales inválidas. Revisá el email y la contraseña.")
      setLoading(false)
    }
  }

  return (
    <div className="app-ui app-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative size-14 overflow-hidden rounded-xl border border-border bg-surface-2">
            <Image src={logo} alt="" fill sizes="56px" className="object-cover" unoptimized />
          </div>
          <h1 className="mt-3.5 text-lg font-semibold tracking-tight">{nombre}</h1>
          <p className="mt-1 text-[13px] text-subtle-foreground">Panel de operación</p>
        </div>

        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-md border border-danger/35 bg-danger/10 px-3 py-2 text-[13px] text-danger">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" /> Ingresando…
                  </>
                ) : (
                  <>
                    <LogIn /> Iniciar sesión
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-[11px] text-subtle-foreground">
          Acceso restringido a operadores autorizados
        </p>
      </div>
    </div>
  )
}
