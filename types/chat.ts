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
    read?: boolean // Message read status
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
    type?: 'text' | 'image' // Message content type
    sendStatus?: 'sending' | 'sent' // Local send status for optimistic updates
    read?: boolean // Message read status
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
    unreadRoom?: boolean
  }
  
  export interface WhatsAppChatProps {
    isAdmin?: boolean
    roomId?: string
    phone?: string
    onBack?: () => void
  }
  
  