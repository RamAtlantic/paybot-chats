// Botón que el bot manda dentro de un mensaje (type: "interactive").
// El front nunca elige la plataforma: manda de vuelta el id de la acción.
export interface MessageAction {
    id: string
    kind: 'assign-account' | 'payment-info'
    label: string
    hint?: string
    responseId?: string
    plataforma?: string
    style?: 'primary' | 'secondary'
  }

// Estado real del mensaje, tal como lo guarda la API.
//   sending   → sólo local, todavía no confirmó el servidor (reloj)
//   sent      → guardado en la API (un tick gris)
//   delivered → le llegó al otro lado (doble tick gris)
//   read      → el otro lado lo tuvo abierto y visible (doble tick azul)
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'

export type MessageSender = 'user' | 'admin'

export interface Message {
    _id: string
    content: string
    timestamp: string
    socketId: string
    username: string
    roomId: string
    phone?: string // Added for traceability with WhatsApp messages
    userId?: string // Added for user identification
    tempMessageId?: string // Temporary ID for local message matching
    read?: boolean // Compat: lo usa el badge de sin leer del panel
    sender?: MessageSender // Quién lo escribió: jugador u operador/bot
    status?: MessageStatus
    deliveredAt?: string | null
    readAt?: string | null
    type?: 'text' | 'image' | 'interactive'
    actions?: MessageAction[]
  }
  
  // Interface for messages returned by the unified API endpoint
  export interface ApiMessage {
    id: string
    content: string
    timestamp: string | number
    username: string
    phone?: string
    socketId?: string
    type?: string
    source: string
    messageId?: string
    conversationId?: string
    ticketId?: string
    actions?: MessageAction[]
    sender?: MessageSender
    status?: MessageStatus
    deliveredAt?: string | null
    readAt?: string | null
  }
  
  // Unified interface for all message types in the chat
  export interface UnifiedMessage {
    _id: string
    content: string
    timestamp: string
    username: string
    phone?: string
    socketId?: string
    roomId?: string
    userId?: string
    messageType: 'chat' | 'whatsapp' // To distinguish message sources
    messageId?: string // For WhatsApp messages
    type_message?: string // For WhatsApp messages
    source?: string // To indicate message source (chat/whatsapp)
    type?: 'text' | 'image' | 'interactive' // Message content type
    actions?: MessageAction[] // Botones del bot
    sendStatus?: 'sending' | 'sent' // Estado local del envío optimista
    read?: boolean // Compat: badge de sin leer del panel
    sender?: MessageSender // Quién lo escribió
    status?: MessageStatus // Estado real: sent | delivered | read
    deliveredAt?: string | null
    readAt?: string | null
  }

  export interface LocalMessage {
    _id: string
    message: string
    timestamp: string
    username: string | null
    phone?: string | null
    socketId?: string | null
    userId?: string | null
    roomId?: string
    type?: 'text' | 'image' // Message content type
  }
  
  export interface User {
    _id: string
    phone: string
    rooms: string[]
    role: string
    isConnected: boolean
    socketId: string
    createdAt: string
    updatedAt: string
    connectedAt: string
  }
  
  export interface ConnectedSocket {
    socketId: ConnectedSocket | string
    role: string
    phone: string
    isValid: boolean
  }
  
  export interface Room {
    _id: string
    name: string
    phone: string
    channel: string
    source: string
    status: "open" | "closed"
    openedAt?: string
    closedAt?: string
    connectedSockets: ConnectedSocket[]
    connectedCount: number
    createdAt: string
    createdFrom: string
    messageCount: number
    userId: string
    metadata: {
      userAgent: string
      ipAddress: string
      timestamp: string
      apiVersion: string
    }
    username?: string
    contactId?: string
    accountId?: string
    tags?: string
    unreadRoom?: boolean
  }
  
  export interface WhatsAppChatProps {
    isAdmin?: boolean
    roomId?: string
    phone?: string
    onBack?: () => void
  }
  
  