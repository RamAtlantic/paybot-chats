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

export const isOwnMessage = (
  message: UnifiedMessage,
  _phone: string | null,
  isAdmin: boolean | undefined
) => {
  // `sender` lo pone la API para TODOS los mensajes: los nuevos lo traen
  // guardado y los viejos se deducen server-side. Es lo único que no depende
  // del socket ni del teléfono.
  //
  // Antes esto se resolvía comparando el `phone` del mensaje con el de la URL.
  // Cuando alguien salía y volvía a entrar por el mismo link, el socket cambiaba
  // y bastaba con que el `phone` guardado no coincidiera —porque el link venía
  // sin el parámetro, por ejemplo— para que TODA la conversación, incluidos sus
  // propios mensajes de antes, se dibujara del lado del operador.
  if (message.sender === "admin") return Boolean(isAdmin);
  if (message.sender === "user") return !isAdmin;

  // Los de WhatsApp (Wati) no tienen `sender`: entran siempre del lado del
  // jugador, porque el webhook sólo guarda lo que llega.
  if (message.source === "whatsapp" || message.messageType === "whatsapp") {
    return !isAdmin;
  }

  // Último recurso, para cualquier mensaje anterior a todo esto: la identidad
  // con la que siempre escribió el operador.
  const esDelOperador =
    message.username === "Admin" || message.socketId === "automation";
  return isAdmin ? esDelOperador : !esDelOperador;
};

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
/**
 * Si el mensaje es una imagen.
 *
 * Se mira por varios lados a propósito. El `type` es lo que corresponde, pero
 * no siempre está: los mensajes que vienen de WhatsApp lo traen en
 * `type_message`, y los viejos del chat se guardaron sin tipo, cuando lo único
 * que los delataba era que el contenido fuera una URL del CDN. Esto lo usan el
 * render de la burbuja y la regla que habilita el acceso a WhatsApp: tienen que
 * estar de acuerdo, o se ve una imagen en pantalla que para la regla no existe.
 */
export const esMensajeDeImagen = (mensaje: {
  type?: string | null
  type_message?: string | null
  content?: string | null
}): boolean => {
  if (mensaje.type === "image" || mensaje.type_message === "image") return true

  const contenido = (mensaje.content || "").trim()
  if (!contenido) return false

  const cdn = process.env.NEXT_PUBLIC_PUBLIC_CDN_URL || ""
  if (cdn && contenido.startsWith(cdn)) return true

  return /^https?:\/\/\S+\.(jpe?g|png|webp|gif|heic|avif)(\?\S*)?$/i.test(contenido)
}
