"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { VantaBackgroundLayout } from "@/components/layout/vanta"
import { SettingsService } from "@/services/settings-service"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [profileImage, setProfileImage] = useState<string>("")
  const { login, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  // Load profile image from settings
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const settingsData = await SettingsService.getSettings();

        if (settingsData.profileImage) {
          // Construir URL completa para mostrar la imagen
          const imageUrl =
            settingsData.profileImage.sizes?.original ||
            settingsData.profileImage.sizes?.small ||
            settingsData.profileImage.originalUrl;
          setProfileImage(
            process.env.NEXT_PUBLIC_PUBLIC_CDN_URL
              ? process.env.NEXT_PUBLIC_PUBLIC_CDN_URL + imageUrl
              : "/logo.png"
          );
        }
      } catch (error) {
        console.error("Error al cargar imagen de perfil:", error);
        // Mantener el logo por defecto si hay error
      }
    };

    loadProfileImage();
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await login(email, password)
      // AuthProvider will handle redirect
    } catch (error: unknown) {
      console.error("Error de login:", error)
      setError("Credenciales inválidas. Por favor, verifica tu email y contraseña.")
      setLoading(false)
    }
  }

  return (
    <VantaBackgroundLayout>
      <div className="w-full max-w-md px-4 mx-auto">
        <Card className="relative backdrop-blur-xl bg-card/60 border-border/50 shadow-[0_0_40px_rgba(37,211,102,0.3)]">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/20 border border-primary/30 shadow-[0_0_25px_rgba(37,211,102,0.5)]">
                {profileImage !== "" && (
                <Image
                  src={profileImage}
                  alt="Logo"
                  width={100}
                  height={100}
                  className="w-full h-full object-cover rounded-full"
                />
                )}
              </div>
            </div>
           
            <CardDescription className="text-emerald-300/90 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
              Accede a tu panel de mensajería
            </CardDescription>

          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-emerald-200/90 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black/40 border-border/50 text-white placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/50 focus:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                  placeholder="tu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-emerald-200/90 font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black/40 border-border/50 text-white placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/50 focus:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:shadow-[0_0_30px_rgba(37,211,102,0.7)] hover:scale-[1.02] transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </VantaBackgroundLayout>
  )
}
