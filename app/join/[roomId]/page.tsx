"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, ArrowRight, AlertCircle } from "lucide-react"
import Link from "next/link"
import { API_ENDPOINTS } from "@/lib/api-config"

interface Room {
  id: string
  name: string
  createdAt: string
  messageCount: number
}

export default function JoinRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params?.roomId as string
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.rooms}/${roomId}`)
        if (response.ok) {
          const roomData = await response.json()
          setRoom(roomData)
        } else if (response.status === 404) {
          setError("Room no encontrada")
        } else {
          setError("Error al cargar la room")
        }
      } catch (error) {
        console.error("Error fetching room:", error)
        setError("Error de conexión")
      } finally {
        setLoading(false)
      }
    }

    if (roomId) {
      fetchRoom()
    }
  }, [roomId])

  const joinRoom = () => {
    router.push(`/chat/${roomId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando room...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">{error || "Room no encontrada"}</h2>
            <p className="text-muted-foreground mb-4">La room que intentas acceder no existe o ha sido eliminada.</p>
            <div className="space-y-2">
              <Link href="/" className="block">
                <Button className="w-full">Volver al inicio</Button>
              </Link>
              <Link href="/admin" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Panel de administración
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">¡Te han invitado a un chat!</CardTitle>
          <CardDescription>Estás a punto de unirte a una room de chat</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Room Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{room.name}</h3>
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                Activa
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Mensajes:</span>
                <Badge variant="outline">{room.messageCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Creada:</span>
                <span>{new Date(room.createdAt).toLocaleDateString("es-ES")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ID de Room:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">{room.id}</code>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <div className="space-y-3">
            <Button onClick={joinRoom} className="w-full" size="lg">
              <MessageSquare className="h-4 w-4 mr-2" />
              Unirse al Chat
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Al unirte, podrás ver y enviar mensajes en tiempo real con otros participantes
            </p>
          </div>

          {/* Alternative Actions */}
          <div className="pt-4 border-t space-y-2">
            <Link href="/" className="block">
              <Button variant="outline" className="w-full bg-transparent">
                Volver al inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
