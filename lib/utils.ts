import { UnifiedMessage } from "@/types/chat"
import { ExtendedRoom } from "@/types/manager"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateAvatar = (phone: string, username?: string) => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ]

  const colorIndex = phone ? phone.slice(-1).charCodeAt(0) % colors.length : 0
  const initials = username ? username.slice(0, 2).toUpperCase() : phone ? phone.slice(-4, -2) : "??"

  return {
    backgroundColor: colors[colorIndex],
    initials,
  }
}

export const isOwnMessage = (message: UnifiedMessage, phone: string | null, isAdmin: boolean | undefined) => {
  // En una sala de chat entre admin y user:
  // - Admin: solo sus mensajes (con su socketId) son propios
  // - User: todos los mensajes que NO tengan el socketId actual son propios
  //        (mensajes históricos suyos + mensajes de WhatsApp sin socketId)
  // - Todos los mensajes que coincidan con el phone del usuario actual son propios

  // Si el mensaje tiene el mismo phone que el usuario actual, es propio
  if (message.phone === phone) {
    return true
  }

  if (isAdmin) {
    // Admin solo ve como propios los mensajes que envió él mismo
    return message.phone === phone || message.username === "Admin"
  } else {
   
    if (message.phone === phone) {
      return true
    } 
    // User ve como propios todos los mensajes que no sean del socket actual
    // (que sería del admin si está conectado)
    return message.phone === phone
  }
}



export const handleKeyPress = (e: React.KeyboardEvent, sendMessage: () => void) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

export const handleFileSelect = (fileInputRef: React.RefObject<HTMLInputElement | null>) => {
  fileInputRef.current?.click();
};

export const getLastMessageTime = (room: ExtendedRoom) => {
  // Usar lastConnectionDate si está disponible, sino openedAt, sino createdAt
  const dateToUse = room.lastConnectionDate || room.openedAt || room.createdAt
  const messageDate = new Date(dateToUse)
  const now = new Date()

  // Verificar si es del día actual
  const isToday = messageDate.toDateString() === now.toDateString()

  if (isToday) {
    // Solo mostrar hora para mensajes del día actual
    return messageDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } else {
    // Mostrar fecha y hora para mensajes de días anteriores
    return messageDate.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};