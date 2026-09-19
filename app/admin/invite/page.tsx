"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, Check, Copy, Link2, Phone, Search } from "lucide-react"

import { AdminShell } from "@/components/admin/admin-shell"
import { Spinner } from "@/components/admin/kit"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminInvitePage() {
  const [phone, setPhone] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [buscando, setBuscando] = React.useState(false)
  const [joinUrl, setJoinUrl] = React.useState<string | null>(null)
  const [copiado, setCopiado] = React.useState(false)

  const buscarOCrear = async (numero: string) => {
    setBuscando(true)
    setError(null)
    setJoinUrl(null)

    const limpio = numero.replace(/\D/g, "")

    try {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms?phone=${limpio}`)
        if (res.ok) {
          const data = await res.json()
          if (data.joinRoom) {
            setJoinUrl(data.joinRoom)
            return
          }
        }
      } catch {
        /* si falla la búsqueda, seguimos y creamos la sala */
      }

      const crear = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: limpio,
          channel: "whatsapp",
          source: "admin-invite",
          name: `Usuario ${limpio}`,
        }),
      })

      if (crear.ok) {
        const data = await crear.json()
        setJoinUrl(`${window.location.origin}/chat/${data.id}?phone=${limpio}`)
      } else {
        const err = await crear.json().catch(() => ({}))
        setError(err.error || "Error al crear la conversación")
      }
    } catch {
      setError("Error de conexión con la API del chat")
    } finally {
      setBuscando(false)
    }
  }

  const copiar = async () => {
    if (!joinUrl) return
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* noop */
    }
  }

  return (
    <AdminShell title="Invitaciones" description="Buscar o crear una conversación por teléfono">
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="size-4 text-primary" /> Link de chat
              </CardTitle>
              <CardDescription>
                Si el número ya tiene sala, se devuelve su link. Si no, se crea una nueva y se
                genera el enlace listo para mandar.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (phone.trim()) buscarOCrear(phone)
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  <Phone className="size-3.5" /> Número de teléfono
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className="num"
                  placeholder="+54 9 223 456 7890"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setError(null)
                    setJoinUrl(null)
                  }}
                  disabled={buscando}
                />
                <p className="text-[11px] text-subtle-foreground">
                  Completo, con código de país
                </p>
              </div>

              {error && (
                <div className="rounded-md border border-danger/35 bg-danger/10 px-3 py-2.5">
                  <p className="text-[13px] text-danger">{error}</p>
                </div>
              )}

              {joinUrl && (
                <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/8 p-3.5">
                  <p className="flex items-center gap-1.5 text-[12px] font-medium text-primary">
                    <Check className="size-3.5" /> Enlace listo
                  </p>
                  <div className="flex gap-2">
                    <Input value={joinUrl} readOnly className="font-mono text-[12px]" />
                    <Button type="button" variant="secondary" size="icon" onClick={copiar} title="Copiar">
                      {copiado ? <Check className="text-primary" /> : <Copy />}
                    </Button>
                    <Button type="button" variant="secondary" size="icon" asChild title="Abrir">
                      <a href={joinUrl} target="_blank" rel="noreferrer">
                        <ArrowUpRight />
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={!phone.trim() || buscando}>
                {buscando ? (
                  <>
                    <Spinner /> Buscando…
                  </>
                ) : (
                  <>
                    <Search /> Buscar o crear conversación
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-[12px] text-subtle-foreground">
          ¿Querés atender las conversaciones?{" "}
          <Link href="/admin" className="text-primary hover:underline">
            Abrir el chat
          </Link>
        </p>
      </div>
    </AdminShell>
  )
}
