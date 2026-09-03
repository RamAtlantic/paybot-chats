"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/context/auth-provider"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // Redirigir a login si no hay usuario autenticado
      router.push("/login")
    }
  }, [user, loading, router])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, no renderizar nada (el useEffect manejará la redirección)
  if (!user) {
    return null
  }

  // Si hay usuario, renderizar los children
  return <>{children}</>
}
