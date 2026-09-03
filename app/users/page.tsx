"use client"
import { Settings, UserPlus, MessageCircle, Users, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Header from "@/components/layout/header"
import * as THREE from "three"

interface VantaEffect {
  destroy: () => void;
}

interface VantaWavesOptions {
  el: HTMLDivElement;
  THREE: typeof THREE;
  mouseControls: boolean;
  touchControls: boolean;
  gyroControls: boolean;
  minHeight: number;
  minWidth: number;
  scale: number;
  scaleMobile: number;
  color: number;
  shininess: number;
  waveHeight: number;
  waveSpeed: number;
  zoom: number;
}

declare global {
  interface Window {
    VANTA: {
      WAVES: (options: VantaWavesOptions) => VantaEffect;
    };
    THREE: typeof THREE;
  }
}

export default function UsuariosPage() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<unknown>(null)

  const [permissions, setPermissions] = useState({
    chats: false,
    contactos: false,
    settings: false,
    respuestasAutomaticas: false,
  })

  useEffect(() => {
    // Load Three.js
    const threeScript = document.createElement("script")
    threeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
    threeScript.async = true
    document.body.appendChild(threeScript)

    threeScript.onload = () => {
      // Load Vanta.js WAVES effect
      const vantaScript = document.createElement("script")
      vantaScript.src = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js"
      vantaScript.async = true
      document.body.appendChild(vantaScript)

      vantaScript.onload = () => {
        if (vantaRef.current && !vantaEffect.current) {
          vantaEffect.current = (window.VANTA as unknown as { WAVES: (options: VantaWavesOptions) => VantaEffect }).WAVES({
            el: vantaRef.current,
            THREE: window.THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0x0a0a0a,
            shininess: 60.0,
            waveHeight: 15.0,
            waveSpeed: 0.6,
            zoom: 0.75,
          })
        }
      }
    }

    return () => {
      if (vantaEffect.current) {
        (vantaEffect.current as unknown as { destroy: () => void }).destroy()
      }
    }
  }, [])

  const handlePermissionChange = (permission: keyof typeof permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }))
  }

  return (
    <ProtectedRoute>
      <div ref={vantaRef} className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-primary/10 pointer-events-none z-0" />
      <div className="relative z-10">
        {/* Minimalist Header */}
        <Header />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Title Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3 text-balance bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(37,211,102,0.5)]">
                Gestión de Usuarios
              </h1>
              <p className="text-emerald-300/90 text-lg text-pretty drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                Crea y administra usuarios del sistema
              </p>
            </div>

            {/* Users Card */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-[0_0_30px_rgba(37,211,102,0.3)]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-emerald-300 to-primary bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(37,211,102,0.5)] flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-primary drop-shadow-[0_0_10px_rgba(37,211,102,0.6)]" />
                  Crear Nuevo Usuario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Form Fields Grid */}
                <div className="grid grid-cols-2 gap-6">
                {/* Username */}
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                    Usuario
                  </Label>
                  <Input
                    id="username"
                    placeholder="John Doe"
                    className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                  />
                  <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="info@atlantics.dev"
                    className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                  />
                </div>
                </div>

                {/* Permissions Section */}
                <div className="space-y-4 pt-4">
                  <Label className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)] text-lg">
                    Permisos de Acceso
                  </Label>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
                    {/* Chats Permission */}
                    <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(37,211,102,0.2)] transition-all">
                      <Checkbox
                        id="chats"
                        checked={permissions.chats}
                        onCheckedChange={() => handlePermissionChange("chats")}
                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_10px_rgba(37,211,102,0.6)]"
                      />
                      <MessageCircle className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(37,211,102,0.4)]" />
                      <Label
                        htmlFor="chats"
                        className="text-emerald-100/90 cursor-pointer flex-1 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]"
                      >
                        Acceso a Chats
                      </Label>
                    </div>

                    {/* Contactos Permission */}
                    <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(37,211,102,0.2)] transition-all">
                      <Checkbox
                        id="contactos"
                        checked={permissions.contactos}
                        onCheckedChange={() => handlePermissionChange("contactos")}
                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_10px_rgba(37,211,102,0.6)]"
                      />
                      <Users className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(37,211,102,0.4)]" />
                      <Label
                        htmlFor="contactos"
                        className="text-emerald-100/90 cursor-pointer flex-1 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]"
                      >
                        Administrar Contactos
                      </Label>
                    </div>

                    {/* Settings Permission */}
                    <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(37,211,102,0.2)] transition-all">
                      <Checkbox
                        id="settings-permission"
                        checked={permissions.settings}
                        onCheckedChange={() => handlePermissionChange("settings")}
                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_10px_rgba(37,211,102,0.6)]"
                      />
                      <Settings className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(37,211,102,0.4)]" />
                      <Label
                        htmlFor="settings-permission"
                        className="text-emerald-100/90 cursor-pointer flex-1 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]"
                      >
                        Acceso a Configuración
                      </Label>
                    </div>

                    {/* Respuestas Automaticas Permission */}
                    <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(37,211,102,0.2)] transition-all">
                      <Checkbox
                        id="respuestas-automaticas"
                        checked={permissions.respuestasAutomaticas}
                        onCheckedChange={() => handlePermissionChange("respuestasAutomaticas")}
                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_10px_rgba(37,211,102,0.6)]"
                      />
                      <Zap className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(37,211,102,0.4)]" />
                      <Label
                        htmlFor="respuestas-automaticas"
                        className="text-emerald-100/90 cursor-pointer flex-1 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]"
                      >
                        Gestionar Respuestas Automáticas
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  
                  <Button
                    variant="outline"
                    className="flex-1 border-primary/50 hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] transition-all bg-transparent"
                  >
                    Cancelar
                  </Button>
                  <Button className="flex-1 bg-primary hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(37,211,102,0.6)] transition-all">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  )
}
