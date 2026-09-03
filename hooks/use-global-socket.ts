"use client"

import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { API_ENDPOINTS } from '@/lib/api-config'

interface GlobalSocketHookReturn {
  socket: Socket | null
  isConnected: boolean
}

export function useGlobalSocket(): GlobalSocketHookReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Crear conexión de socket global
    const socketInstance = io(API_ENDPOINTS.socket, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
    })

    // Configurar listeners de conexión
    socketInstance.on('connect', () => {
      console.log('Global socket connected')
      setIsConnected(true)
    })

    socketInstance.on('connect_error', (error) => {
      console.log('Global socket connection error:', error.message)
      setIsConnected(false)
    })

    socketInstance.on('disconnect', () => {
      console.log('Global socket disconnected')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    // Cleanup al desmontar
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return {
    socket,
    isConnected,
  }
}
