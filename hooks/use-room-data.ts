import { useEffect, useState } from "react"
import { API_ENDPOINTS } from "@/lib/api-config"
import { ApiMessage, ConnectedSocket, Room, UnifiedMessage, User } from "@/types/chat"

interface UseRoomDataProps {
  roomId: string
  currentUser: User | null
  isAdmin: boolean
  setMessages: (messages: UnifiedMessage[]) => void
  setConnectedSockets: (connectedSockets: ConnectedSocket[]) => void
}

interface UseRoomDataReturn {
  room: Room | null
  loading: boolean
  error: string | null
}

export function useRoomData({ roomId, currentUser, isAdmin, setMessages, setConnectedSockets }: UseRoomDataProps): UseRoomDataReturn {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true)
        setError(null)

        const roomResponse = await fetch(`${API_ENDPOINTS.rooms}/${roomId}`)
        if (roomResponse.ok) {
          const roomData = await roomResponse.json()
          setRoom(roomData)
          if (roomData.connectedSockets) {
            // Transformar a nueva estructura si viene como strings
            const transformedSockets = Array.isArray(roomData.connectedSockets) && roomData.connectedSockets.length > 0 && typeof roomData.connectedSockets[0] === 'string'
              ? (roomData.connectedSockets as string[]).map((socketId: string) => ({
                  socketId,
                  role: 'user', // Default role, should be updated when API provides real data
                  phone: roomData.phone,
                  isValid: true
                }))
              : (roomData.connectedSockets as unknown as ConnectedSocket[])
            setConnectedSockets(transformedSockets)
          }
        } else {
          throw new Error(`Error fetching room: ${roomResponse.status}`)
        }

        // Fetch all messages (chat + WhatsApp) using the unified endpoint
        const messagesResponse = await fetch(`${API_ENDPOINTS.messages}/${roomId}`)
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          console.log(messagesData, 'messagesData')

          // Convert messages to unified format - treat all messages as chat messages for synchronization
          const unifiedMessages = messagesData.map((msg: ApiMessage): UnifiedMessage => ({
            _id: msg.id,
            content: msg.content,
            timestamp: typeof msg.timestamp === 'number' ? new Date(msg.timestamp).toISOString() : msg.timestamp,
            username: msg.phone || msg.username, // Use phone as username
            phone: msg.phone,
            socketId: msg.socketId,
            roomId: roomId,
            messageType: 'chat', // All messages are treated as chat messages
            messageId: msg.messageId,
            type_message: msg.type,
            source: msg.source
          }))

          // Modificar mensajes si el rol del usuario es 'user' y NO está en modo admin
          if (currentUser?.role === 'user' && !isAdmin) {
            unifiedMessages.forEach((message: UnifiedMessage) => {
              message.socketId = currentUser.socketId;
              message.userId = currentUser._id;
            });
          }

          // Ordenar mensajes de más antiguo a más reciente
          unifiedMessages.sort((a: UnifiedMessage, b: UnifiedMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

          setMessages(unifiedMessages)
        } else {
          throw new Error(`Error fetching messages: ${messagesResponse.status}`)
        }

       /*  const usersResponse = await fetch(`${API_ENDPOINTS.users}`)
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          const usersMap = new Map()
          usersData.forEach((user: User) => {
            usersMap.set(user.socketId, user)
            usersMap.set(user._id, user)
          })
          setUsers(usersMap)
        } else {
          throw new Error(`Error fetching users: ${usersResponse.status}`)
        } */
      } catch (error) {
        console.error("Error fetching room data:", error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (roomId) {
      fetchRoomData()
    }
  }, [roomId, currentUser, isAdmin])

  return {
    room,
    loading,
    error
  }
}
