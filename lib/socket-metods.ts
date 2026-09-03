import { uploadImageToR2 } from "./upload-cdn";
import { Message, UnifiedMessage } from "@/types/chat";
import {
  SocketOnData,
  SocketOffData,
  SocketChatMessageData,
  SocketRoomUsersData,
  SendChatMessageData,
  SendImageMessageData,
} from "@/types/methods";
import { Socket } from "socket.io-client";
import { SettingsService } from "@/services/settings-service";

// funcion para conectar el socket
export function socketOn(
  data: SocketOnData & {
    isAdmin?: boolean;
    messagesRoom?: UnifiedMessage[] | null;
  }
) {
  const {
    socketInstance,
    roomId,
    users,
    setConnected,
    setCurrentUser,
    phone,
    isAdmin,
    messagesRoom,
  } = data;
  return async () => {
    setConnected(true);
    socketInstance.emit("join-room", roomId);
    const currentSocketUser = Array.from(users.values()).find(
      (user) => user.socketId === socketInstance.id
    );

    if (currentSocketUser) {
      setCurrentUser(currentSocketUser);
    }

    // Solo enviar mensaje de bienvenida si no es admin
    if (!isAdmin) {
      const result = await sendWelcomeMessage({
        socket: socketInstance,
        roomId,
        phone,
        messagesRoom,
      });
      result();
    }
  };
}

// funcion para desconectar el socket
export function socketOff(data: SocketOffData) {
  const { setConnected, setConnectedSockets } = data;
  return () => {
    setConnected(false);
    setConnectedSockets([]);
    console.log("Disconnected from server");
  };
}

// funcion para unificar los mensajes de chat y whatsapp
export function socketChatMessage(data: SocketChatMessageData) {
  const { setMessages, setLocalMessages, currentUser } = data;
  return (message: Message & { type?: "text" | "image" }) => {
    console.log("Mensaje recibido:", message);

    const unifiedMessage: UnifiedMessage = {
      ...message,
      username: message.phone || message.username, // Use phone as username
      socketId: message.socketId || currentUser?.socketId || "unknown",
      userId: message.userId || currentUser?._id || "unknown",
      messageType: "chat",
      source: "chat",
      type: message.type || "text", // Tipo por defecto 'text'
      sendStatus: "sent", // Mensaje confirmado por el servidor
      read: message.read || false, // Incluir estado de lectura
    };

    // Verificar si hay un mensaje local correspondiente para reemplazarlo
    setLocalMessages((prevLocalMessages) => {
      // Optimización: buscar primero por tempMessageId (más rápido y preciso)
      if (message.tempMessageId) {
        const index = prevLocalMessages.findIndex(localMsg => localMsg._id === message.tempMessageId);
        if (index !== -1) {
          return prevLocalMessages.filter((_, i) => i !== index);
        }
      }

      // Fallback: buscar por contenido y estado "sending"
      const content = unifiedMessage.content.trim();
      const index = prevLocalMessages.findIndex(
        localMsg => localMsg.content.trim() === content && localMsg.sendStatus === "sending"
      );

      if (index !== -1) {
        return prevLocalMessages.filter((_, i) => i !== index);
      }

      return prevLocalMessages;
    });

    // Agregar el mensaje confirmado a los mensajes reales
    setMessages((prev) => [...prev, unifiedMessage]);
  };
}

// funcion para obtener los usuarios conectados al chat
export function socketRoomUsers(data: SocketRoomUsersData) {
  const { setConnectedSockets, room, phone } = data;
  return (sockets: string[]) => {
    console.log("Usuarios conectados:", sockets.length, "sockets:", sockets);
    const transformedSockets = sockets.map((socketId: string) => ({
      socketId,
      role: "user",
      phone: room?.phone || phone || "",
      isValid: true,
    }));
    setConnectedSockets(transformedSockets);
  };
}

// funcion para enviar un mensaje de chat
export function sendChatMessage(data: SendChatMessageData) {
  // Destructurar los datos
  const {
    isAdmin,
    socket,
    roomId,
    newMessage,
    phone,
    room,
    currentUser,
    setNewMessage,
    setLocalMessages,
  } = data;

  // Función para enviar el mensaje
  return () => {
    if (!socket || !newMessage.trim()) return;

    // Usar el socketId y userId del usuario conectado
    const connectedUser = currentUser || {
      socketId: socket.id,
      _id: "unknown",
    };

    

    // Crear ID único temporal para rastrear el mensaje
    const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Enviar mensaje al servidor con el ID temporal
    socket.emit("chat-message", {
      roomId,
      message: newMessage,
      phone: phone, // Use current user's phone or room phone
      username: phone || room?.phone, // Use phone as username
      socketId: connectedUser.socketId,
      userId: connectedUser._id,
      type: "text", // Tipo de mensaje de texto
      read: isAdmin ? true : false, // Los mensajes de admin se envían como leídos
      tempMessageId: tempMessageId, // Incluir ID temporal para matching
    });

    // Crear mensaje local optimista para mostrar inmediatamente
    const optimisticMessage: UnifiedMessage = {
      _id: tempMessageId,
      content: newMessage,
      timestamp: new Date().toISOString(),
      username: phone || room?.phone || "",
      phone: phone || "",
      socketId: connectedUser.socketId,
      roomId: roomId,
      userId: connectedUser._id,
      messageType: "chat",
      source: "chat",
      type: "text",
      sendStatus: "sending", // Estado inicial: enviando
      read: isAdmin ? true : false, // Los mensajes de admin se marcan como leídos
    };

    // Agregar mensaje local al estado inmediatamente
    setLocalMessages((prev: UnifiedMessage[]) => [...prev, optimisticMessage]);

    

    // Limpiar el input
    setNewMessage("");
  };
}

// funcion para enviar mensaje de bienvenida como admin
export async function sendWelcomeMessage(data: {
  socket: Socket | null;
  roomId: string;
  phone?: string | null;
  messagesRoom?: UnifiedMessage[] | null;
}) {
  const { socket, roomId, phone, messagesRoom } = data;

  return async () => {
    if (!socket || !socket.id) return;
    if (messagesRoom && messagesRoom.length > 0) return;

    try {
      // Obtener el mensaje de bienvenida desde los settings
      const settings = await SettingsService.getSettings();
      const welcomeMessage = settings.welcomeMessage || "¡Hola! Bienvenido al chat. ¿En qué podemos ayudarte?";

      // Usar datos del admin/bot para el mensaje de bienvenida
      const adminUser = {
        socketId: socket?.id || "",
        _id: "admin-welcome-bot",
      };

      socket?.emit("chat-message", {
        roomId,
        message: welcomeMessage,
        phone: phone,
        username: "Admin",
        socketId: adminUser.socketId,
        userId: adminUser._id,
        type: "text",
        welcome: true,
      });
    } catch (error) {
      console.error("Error obteniendo mensaje de bienvenida:", error);
      // Fallback al mensaje por defecto en caso de error
      const adminUser = {
        socketId: socket?.id || "",
        _id: "admin-welcome-bot",
      };

      socket?.emit("chat-message", {
        roomId,
        message: "¡Hola! Bienvenido al chat. ¿En qué podemos ayudarte?",
        phone: phone,
        username: "Admin",
        socketId: adminUser.socketId,
        userId: adminUser._id,
        type: "text",
        welcome: true,
      });
    }
  };
}

// funcion para enviar una imagen de chat
export function sendImageMessage(data: SendImageMessageData) {
  const {
    isAdmin,
    socket,
    roomId,
    phone,
    room,
    currentUser,
    setIsUploadingImage,
    fileInputRef,
    file,
  } = data;
  return async () => {
    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona solo archivos de imagen");
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Máximo 10MB");
      return;
    }

    try {
      setIsUploadingImage(true);

      // Subir la imagen usando la función de upload-cdn.ts
      const uploadResult = await uploadImageToR2(file);

      // Enviar mensaje con la imagen
      const connectedUser = currentUser || {
        socketId: socket?.id || "",
        _id: "unknown",
      };

      socket?.emit("chat-message", {
        roomId,
        message: `${process.env.NEXT_PUBLIC_PUBLIC_CDN_URL || ""}${
          uploadResult.originalUrl
        }`, // La URL completa de la imagen como contenido
        phone: phone,
        username: phone || room?.phone,
        socketId: connectedUser.socketId,
        userId: connectedUser._id,
        type: "image", // Tipo de mensaje
        read: isAdmin ? true : false, // Los mensajes de admin se envían como leídos
      });
    } catch (error) {
      console.error("Error al subir imagen:", error);
      alert("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setIsUploadingImage(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
}
