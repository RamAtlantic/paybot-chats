export interface ConnectedSocket {
    socketId: string
    role: string
    phone: string
    isValid: boolean
  }
  
  // Interfaz extendida para el componente (con nueva estructura de sockets)
  export interface ExtendedRoom {
    id: string
    name: string
    phone: string
    channel: string
    source: string
    status: "open" | "closed"
    openedAt?: string
    closedAt?: string
    createdAt: string
    createdFrom: string
    lastConnectionDate?: string
    connectedSockets: ConnectedSocket[]
    connectedCount: number
    messageCount: number
    metadata?: Record<string, unknown>
    contactId?: string
    username?: string
    tags?: string
    lastMessage?: string
    lastMessageType?: string
    unreadCount?: number
    unreadRoom?: boolean
  }
  
  export interface WhatsAppRoomManagerProps {
    onRoomSelected?: (room: ExtendedRoom) => void
    initialRoomId?: string
    initialPhone?: string
  }