import { ConnectedSocket, Room, UnifiedMessage, User } from "./chat"
import { SettingsData } from "./settings"

export interface FetchRoomDataParams {
    roomId: string
    currentUser: User | null
    isAdmin: boolean
  }
  
export interface FetchRoomDataResult {
    room: Room | null
    messages: UnifiedMessage[]
    connectedSockets: ConnectedSocket[]
    users: Map<string, User>
    settings: SettingsData | null
  }
  
export interface DisconnectResult {
    success: boolean
    message: string
    userId?: string
    remainingConnections: number
  }