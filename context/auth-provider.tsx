"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { type User, signInWithEmailAndPassword, signOut, onAuthStateChanged, getIdTokenResult } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  getTimeUntilExpiration: () => Promise<number | null>
}

// contexto para la autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// provider para la autenticación
export function AuthProvider({ children }: { children: React.ReactNode }) {

  // estado para el usuario
  const [user, setUser] = useState<User | null>(null)
  // estado para el loading
  const [loading, setLoading] = useState(true)
  // router para redirigir
  const router = useRouter()

  // Función para verificar si el token está vencido
  const checkTokenExpiration = async (user: User): Promise<boolean> => {
    try {
      const tokenResult = await getIdTokenResult(user)
      const issuedAtTime = new Date(tokenResult.issuedAtTime).getTime()
      const currentTime = new Date().getTime()
      const timeSinceIssued = currentTime - issuedAtTime

      // Considerar vencido si han pasado más de 5 minutos desde que se emitió
      // Esto simula tokens que duran solo 5 minutos en lugar de 1 hora
      return timeSinceIssued > 60 * 60 * 1000
    } catch (error) {
      console.error("Error verificando token:", error)
      return true // Considerar vencido si hay error
    }
  }

  // Función para cerrar sesión automáticamente
  const handleAutoLogout = useCallback(async () => {
    try {
      await signOut(auth)
      setUser(null)
      if (typeof window !== 'undefined') {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error en logout automático:", error)
    }
  }, [router])

  // efecto para verificar token de autenticación
  useEffect(() => {
    let tokenCheckInterval: NodeJS.Timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isExpired = await checkTokenExpiration(firebaseUser)

        if (isExpired) {
          console.log("Token vencido, cerrando sesión...")
          await handleAutoLogout()
        } else {
          setUser(firebaseUser)

          // Verificar token cada 1 minuto
          tokenCheckInterval = setInterval(async () => {
            if (firebaseUser) {
              const isExpired = await checkTokenExpiration(firebaseUser)
              if (isExpired) {
                console.log("Token próximo a vencer, cerrando sesión...")
                clearInterval(tokenCheckInterval)
                await handleAutoLogout()
              }
            }
          }, 1 * 60 * 1000) // Cada 1 minuto (para pruebas)
        }
      } else {
        setUser(null)
        if (tokenCheckInterval) {
          clearInterval(tokenCheckInterval)
        }
      }

      setLoading(false)
    })

    return () => {
      unsubscribe()
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval)
      }
    }
  }, [router, handleAutoLogout])

  // funcion para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      throw error
    }
  }

  // funcion para cerrar sesión
  const logout = async () => {
    try {
      await signOut(auth)
      if (typeof window !== 'undefined') {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // funcion para renovar token
  const refreshToken = async () => {
    if (user) {
      try {
        await getIdTokenResult(user, true)
        console.log("Token renovado exitosamente")
      } catch (error) {
        console.error("Error renovando token:", error)
        await handleAutoLogout()
      }
    }
  }

  // funcion para obtener tiempo hasta expiración
  const getTimeUntilExpiration = async (): Promise<number | null> => {
    if (!user) return null

    try {
      const tokenResult = await getIdTokenResult(user)
      const issuedAtTime = new Date(tokenResult.issuedAtTime).getTime()
      const currentTime = new Date().getTime()
      const timeSinceIssued = currentTime - issuedAtTime

      // Calcular tiempo restante basado en duración de 5 minutos
      const totalDuration = 5 * 60 * 1000 // 5 minutos
      const timeLeft = Math.max(0, totalDuration - timeSinceIssued)

      return timeLeft
    } catch (error) {
      console.error("Error obteniendo tiempo hasta expiración:", error)
      return null
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshToken, getTimeUntilExpiration }}>{children}</AuthContext.Provider>
}

// hook para obtener el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
