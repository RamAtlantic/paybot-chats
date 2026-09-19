import { API_ENDPOINTS } from "@/lib/api-config"
import { ApiMessage, ConnectedSocket, Room, UnifiedMessage, User } from "@/types/chat"
import { DisconnectResult, FetchRoomDataParams, FetchRoomDataResult } from "@/types/room"



export class RoomService {

  // funcion para obtener los datos de la sala
  static async fetchRoomData({ roomId, currentUser, isAdmin }: FetchRoomDataParams): Promise<FetchRoomDataResult> {
    const result: FetchRoomDataResult = {
      room: null,
      messages: [],
      connectedSockets: [],
      users: new Map(),
      settings: null
    }

    try {
      // Fetch room data
      const roomResponse = await fetch(`${API_ENDPOINTS.rooms}/${roomId}`)
      if (roomResponse.ok) {
        const roomData = await roomResponse.json()
        result.room = roomData

        // Transform connected sockets
        if (roomData.connectedSockets) {
          const transformedSockets = Array.isArray(roomData.connectedSockets) &&
            roomData.connectedSockets.length > 0 &&
            typeof roomData.connectedSockets[0] === 'string'
            ? (roomData.connectedSockets as string[]).map((socketId: string) => ({
                socketId,
                role: 'user' as const,
                phone: roomData.phone,
                isValid: true
              }))
            : (roomData.connectedSockets as unknown as ConnectedSocket[])
          result.connectedSockets = transformedSockets
        }
      }

      // Fetch messages
      const messagesResponse = await fetch(`${API_ENDPOINTS.messages}/${roomId}`)
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()

        // Convert messages to unified format
        const unifiedMessages = messagesData.map((msg: ApiMessage): UnifiedMessage => ({
          _id: msg.id,
          content: msg.content,
          timestamp: typeof msg.timestamp === 'number' ? new Date(msg.timestamp).toISOString() : msg.timestamp,
          username: msg.phone || msg.username,
          phone: msg.phone,
          socketId: msg.socketId,
          roomId: roomId,
          messageType: 'chat',
          messageId: msg.messageId,
          type_message: msg.type,
          source: msg.source,
          // Los mensajes con botones del bot llegan como "interactive"; el resto
          // se sigue tratando como texto (las imágenes se detectan por la URL).
          type: msg.type === 'interactive' ? 'interactive' : 'text',
          actions: msg.actions || []
        }))

        // Modify messages if user role is 'user' and NOT in admin mode
        if (currentUser?.role === 'user' && !isAdmin) {
          unifiedMessages.forEach((message: UnifiedMessage) => {
            message.socketId = currentUser.socketId
            message.userId = currentUser._id
          })
        }

        // Sort messages from oldest to newest
        unifiedMessages.sort((a: UnifiedMessage, b: UnifiedMessage) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )

        result.messages = unifiedMessages
      }

      // Fetch users
      const usersResponse = await fetch(`${API_ENDPOINTS.users}`)
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const usersMap = new Map<string, User>()
        usersData.forEach((user: User) => {
          usersMap.set(user.socketId, user)
          usersMap.set(user._id, user)
        })
        result.users = usersMap
      }

      // Fetch settings
      const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`)
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        result.settings = settingsData
      }

    } catch (error) {
      console.error("Error in RoomService.fetchRoomData:", error)
      throw error
    }

    return result
  }
  
  // funcion para obtener la sala
  static async fetchRoom(roomId: string): Promise<Room> {
    const response = await fetch(`${API_ENDPOINTS.rooms}/${roomId}`)
    if (!response.ok) {
      throw new Error(`Error fetching room: ${response.status}`)
    }
    return response.json()
  }
  
  // funcion para desconectar de la sala
  static async disconnectFromRoom(
    roomId: string,
    socketId: string,
    reason: string = "manual_disconnect"
  ): Promise<DisconnectResult> {
    try {
      const response = await fetch(`${API_ENDPOINTS.rooms}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          socketId,
          reason
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error disconnecting socket from room:", error)
      throw new Error(`Failed to disconnect socket: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // funcion para eliminar una sala
  static async deleteRoom(roomId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_ENDPOINTS.rooms}/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error deleting room:", error)
      throw new Error(`Failed to delete room: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // funcion para actualizar el estado de lectura de una sala
  static async updateUnreadRoomStatus(roomId: string, unreadRoom: boolean): Promise<{ success: boolean; message: string; data: { roomId: string; unreadRoom: boolean; updatedAt: Date } }> {
    try {
      const response = await fetch(`${API_ENDPOINTS.rooms}/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unreadRoom
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error updating unread room status:", error)
      throw new Error(`Failed to update unread room status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // funcion para archivar una sala
  static async archiveRoom(roomId: string): Promise<{ success: boolean; message: string; roomId: string; archivedAt: Date }> {
    try {
      const response = await fetch(`${API_ENDPOINTS.rooms}/archive/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error archiving room:", error)
      throw new Error(`Failed to archive room: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

}