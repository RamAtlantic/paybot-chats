"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Phone, CheckCheck, Copy, Check } from "lucide-react"
import Link from "next/link"


export default function AdminInvitePage() {
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [joinUrl, setJoinUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)


  const searchRoomByPhone = async (phoneNumber: string) => {
    setSearching(true)
    setError(null)
    setJoinUrl(null)

    try {
      // Remove formatting for API call
      const cleanPhone = phoneNumber.replace(/\D/g, "")

      // Try to search for existing room first
      try {
        const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms?phone=${cleanPhone}`)

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()

          if (searchData.joinRoom) {
            // Found existing room, show the join URL
            setJoinUrl(searchData.joinRoom)
            
            return
          }
        }
      } catch {
        console.log("Search failed, proceeding to create new room...")
      }

      // If search failed or no room found, create a new one
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: cleanPhone,
          channel: 'whatsapp',
          source: 'admin-invite',
          name: `Usuario ${cleanPhone}`,
        })
      })

      if (createResponse.ok) {
        const createData = await createResponse.json()

        // Generate the join URL from the created room data
        const joinUrl = `${window.location.origin}/chat/${createData.id}?phone=${cleanPhone}`
        setJoinUrl(joinUrl)
       
      } else {
        const errorData = await createResponse.json().catch(() => ({}))
        setError(errorData.error || "Error al crear la conversación")
      }
    } catch (error) {
      console.error("Error creating room:", error)
      setError("Error de conexión")
    } finally {
      setSearching(false)
    }
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return

    await searchRoomByPhone(phone)
  }

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    // Clear previous results when phone changes
    setError(null)
    setJoinUrl(null)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#111b21] flex flex-col">
      {/* WhatsApp-style Header */}
      <div className="bg-[#202c33] px-4 py-3 flex items-center gap-4 border-b border-[#2a3942]">
        <Link href="/admin" className="text-[#8696a0] hover:text-white transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-white text-lg font-medium">Buscar conversación</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* WhatsApp-style Invitation Card */}
          <div className="bg-[#202c33] rounded-lg overflow-hidden">
            {/* Avatar Section */}
            <div className="bg-[#0b141a] py-12 flex justify-center">
              <Avatar className="h-32 w-32 border-4 border-[#202c33]">
                <AvatarImage src="/casino-logo.png" alt="Admin Search" />
                <AvatarFallback className="bg-[#00a884] text-white text-4xl font-semibold">🔍</AvatarFallback>
              </Avatar>
            </div>

            {/* Info Section */}
            <div className="px-6 py-6 space-y-4">
              {/* Name */}
              <div className="text-center">
                <h2 className="text-white text-2xl font-medium mb-1">Panel de Administración</h2>
                <p className="text-[#8696a0] text-sm">Buscar conversación existente</p>
              </div>

              {/* Description */}
              <div className="bg-[#0b141a] rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#00a884] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[#8696a0] text-xs mb-1">Búsqueda por teléfono</p>
                    <p className="text-white text-sm">Ingresa el número para buscar</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0b141a] rounded-lg p-4">
                <p className="text-[#8696a0] text-sm leading-relaxed">
                  Busca conversaciones existentes por número de teléfono. Si no existe, se creará automáticamente una nueva conversación con enlace de invitación.
                </p>
              </div>

              {/* Phone Input Form */}
              <form onSubmit={handlePhoneSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-[#8696a0] text-sm block">
                    Número de teléfono
                  </label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+54 9 223 456 7890"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="bg-[#2a3942] border-[#2a3942] text-white placeholder:text-[#667781] focus:border-[#00a884] focus:ring-[#00a884] h-12 px-4"
                      disabled={searching}
                    />
                  </div>
                  <p className="text-[#667781] text-xs">Ingresa el número completo incluyendo código de país</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-[#233138] border border-[#ea4335]/30 rounded-lg p-3">
                    <p className="text-[#ea4335] text-sm">{error}</p>
                  </div>
                )}

                {/* Success - Join URL */}
                {joinUrl && (
                  <div className="bg-[#0b141a] rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <CheckCheck className="h-5 w-5" />
                      <span className="text-sm font-medium">¡Enlace generado!</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[#8696a0] text-xs">Enlace de invitación:</p>
                      <div className="flex gap-2">
                        <Input
                          value={joinUrl}
                          readOnly
                          className="bg-[#2a3942] border-[#2a3942] text-white text-sm"
                        />
                        <Button
                          type="button"
                          onClick={() => copyToClipboard(joinUrl)}
                          className={`bg-[#00a884] hover:bg-[#00a884]/90 text-white px-3 transition-all duration-200 ${copied ? 'bg-green-500 hover:bg-green-500 scale-110' : ''}`}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 animate-pulse" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                       {/*  <Button
                          type="button"
                          onClick={() => router.push("/admin?frame=true&joinUrl=" + adminJoinUrl)}
                          variant="outline"
                          className="border-[#2a3942] text-[#8696a0] hover:bg-[#2a3942] px-3"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button> */}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white h-12 text-base font-medium rounded-lg transition-colors"
                  disabled={!phone.trim()}
                >
                  {searching ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Buscando / creando...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="h-5 w-5 mr-2" />
                      Buscar / crear conversación
                    </>
                  )}
                </Button>
              </form>

              {/* Footer Info */}
              <div className="pt-4 border-t border-[#2a3942]">
                <p className="text-[#667781] text-xs text-center leading-relaxed">
                  Herramienta administrativa automática: busca conversaciones existentes o crea nuevas con enlaces de invitación listos para compartir.
                </p>
              </div>
            </div>
          </div>

          {/* Alternative Actions */}
          <div className="mt-6 space-y-2">
            <Link href="/admin" className="block">
              <Button variant="ghost" className="w-full text-[#00a884] hover:text-[#00a884] hover:bg-[#202c33] h-11">
                ← Volver al panel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
