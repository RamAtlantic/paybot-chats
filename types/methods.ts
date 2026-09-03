import { ConnectedSocket, Room, UnifiedMessage, User } from "./chat";
import { Socket } from "socket.io-client";

export interface SocketOnData {
  socketInstance: Socket;
  roomId: string;
  users: Map<string, User>;
  setConnected: (connected: boolean) => void;
  setCurrentUser: (user: User) => void;
  phone?: string | null;
}

export interface SocketOffData {
  setConnected: (connected: boolean) => void;
  setConnectedSockets: (connectedSockets: ConnectedSocket[]) => void;
}

export interface SocketChatMessageData {
  setMessages: React.Dispatch<React.SetStateAction<UnifiedMessage[]>>;
  setLocalMessages: React.Dispatch<React.SetStateAction<UnifiedMessage[]>>;
  currentUser?: User | null;
}

export interface SocketRoomUsersData {
  setConnectedSockets: (sockets: ConnectedSocket[]) => void;
  room?: { phone?: string } | null;
  phone?: string | null;
}

export interface SendChatMessageData {
  isAdmin?: boolean;
  socket: Socket;
  roomId: string;
  newMessage: string;
  phone?: string | null;
  room?: Room | null;
  currentUser?: User | null;
  setNewMessage: (message: string) => void;
  setLocalMessages: React.Dispatch<React.SetStateAction<UnifiedMessage[]>>;
}

export interface SendImageMessageData {
  isAdmin?: boolean;
  socket?: Socket | null;
  roomId: string;
  phone?: string | null;
  room?: Room | null;
  currentUser?: User | null;
  setIsUploadingImage: (uploading: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  file: File;
}
