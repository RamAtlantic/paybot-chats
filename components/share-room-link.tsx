"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Share, Check, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShareRoomLinkProps {
  roomId: string
  roomName: string
}

export function ShareRoomLink({ roomId, roomName }: ShareRoomLinkProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const urlBase = process.env.NEXT_PUBLIC_URL_DEPLOY_VERCEL
  const directLink = `${urlBase}/chat/${roomId}`
  const joinLink = `${urlBase}/join/${roomId}`

  // Copia el texto al portapapeles
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "¡Copiado!",
        description: `${type} copiado al portapapeles`,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Error",
        description: "No se pudo copiar el link",
        variant: "destructive",
      })
    }
  }

  // Comparte el link con el sistema de compartir
  const shareLink = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete al chat: ${roomName}`,
          text: `Te invito a unirte a nuestro chat "${roomName}"`,
          url: url,
        })
      } catch (error) {
        console.error("Error sharing link:", error)
        // User cancelled sharing or error occurred
        copyToClipboard(url, "Link de invitación")
      }
    } else {
      copyToClipboard(url, "Link de invitación")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share className="h-5 w-5" />
          Compartir Room
        </CardTitle>
          <CardDescription>Comparte estos links para que otros se unan a {roomName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Join Link (Recommended) */}
        <div className="space-y-2">
          <Label htmlFor="joinLink">Link de Invitación (Recomendado)</Label>
          <div className="flex gap-2">
            <Input id="joinLink" value={joinLink} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(joinLink, "Link de invitación")}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => shareLink(joinLink)}>
              <Share className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Este link muestra información de la room antes de unirse</p>
        </div>

        {/* Direct Link */}
        <div className="space-y-2">
          <Label htmlFor="directLink">Link Directo</Label>
          <div className="flex gap-2">
            <Input id="directLink" value={directLink} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(directLink, "Link directo")}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.open(directLink, "_blank")}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Este link lleva directamente al chat</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="default" onClick={() => shareLink(joinLink)} className="flex-1">
            <Share className="h-4 w-4 mr-2" />
            Compartir Invitación
          </Button>
          <Button variant="outline" onClick={() => copyToClipboard(joinLink, "Link de invitación")} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Copiar Link
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
