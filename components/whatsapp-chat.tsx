"use client";

import { useQuery } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Send, Mic } from "lucide-react";
import type React from "react";
import { SettingsData } from "@/types/settings";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/lib/api-config";
import { RoomService } from "@/services/room-service";
import {
  ConnectedSocket,
  Message,
  Room,
  UnifiedMessage,
  User,
  WhatsAppChatProps,
} from "@/types/chat";
import {
  socketOff,
  socketOn,
  socketChatMessage,
  socketRoomUsers,
  sendChatMessage,
  sendImageMessage,
} from "@/lib/socket-metods";
import { useMessageStatus } from "@/hooks/use-message-status";
import Messages from "./messages";
import HeaderChat from "./chat/header-chat";
import ErrorCard from "./chat/error-chat";
import LoadingChat from "./chat/loading-chat";
import NotFound from "./chat/not-found";
import EmptyChat from "./chat/empty-chat";
import InputChat from "./chat/input-chat";
import WhatsAppCta from "./chat/whatsapp-cta";
import TypingIndicator from "./chat/typing-indicator";

export default function WhatsAppChat({
  isAdmin,
  roomId: propRoomId,
  phone: propPhone,
  onBack,
}: WhatsAppChatProps) {

  // Detectar si estamos en un iframe
  const isInIframe =
    typeof window !== "undefined" && window.self !== window.top;
  const params = useParams();
  const searchParams = useSearchParams();

  // Usar props si están disponibles, sino usar parámetros de URL
  const roomId =
    propRoomId ||
    (typeof params?.roomId === "string" ? params.roomId : "") ||
    "";
  const phone = propPhone || searchParams.get("phone");

  // instancia de sockets
  const [localMessages, setLocalMessages] = useState<UnifiedMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  // Cambios que la API avisa por socket (hoy: la cuenta que entrega la
  // automation). Van aparte de `room` a propósito: `room` es dependencia del
  // efecto del socket, así que meterlos ahí reconectaría el socket justo en el
  // momento en que el jugador está recibiendo sus credenciales.
  const [roomPatch, setRoomPatch] = useState<Partial<Room> | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectedSockets, setConnectedSockets] = useState<ConnectedSocket[]>(
    []
  );

  // instancia de states
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // El bot está preparando un mensaje automático (evento `bot-typing` de la API)
  const [botEscribiendo, setBotEscribiendo] = useState(false);

  // instancia de refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Solo contar usuarios conectados (rol "user")
  const connectedUsers = connectedSockets.filter(
    (socket) => socket.role === "user"
  );

  // función para scrollar al final del chat
  //
  // Se scrollea EL CONTENEDOR, no el elemento. `scrollIntoView` recorre todos
  // los ancestros scrolleables —incluido el documento— así que si la página
  // tiene aunque sea unos píxeles de scroll, arrastra la ventana entera y el
  // chat se sube: la barra de escribir termina en el medio de la pantalla.
  // Se veía cada vez que aparecían los puntitos de "escribiendo…".
  const scrollToBottom = () => {
    const contenedor = scrollContainerRef.current;
    if (contenedor) {
      contenedor.scrollTo({ top: contenedor.scrollHeight, behavior: "smooth" });
      return;
    }
    // Sin el contenedor, `nearest` es lo único que no mueve la ventana.
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // efecto para scrollar al final del chat
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, botEscribiendo]);

  // Query para fetch room data usando React Query
  const {
    data: roomData,
    isLoading: isLoadingRoomData,
    error: roomDataError,
  } = useQuery({
    queryKey: [
      "room-data",
      roomId,
      currentUser?._id,
      currentUser?.role,
      isAdmin,
    ],
    queryFn: () =>
      RoomService.fetchRoomData({
        roomId,
        currentUser,
        isAdmin: isAdmin || false,
      }),
    enabled: roomId !== "", // Solo ejecutar si roomId no está vacío
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  // Mensajes de la sala
  const messagesRoom: UnifiedMessage[] | null = roomData?.messages || null;

  // Actualizar states cuando los datos de la query cambian
  useEffect(() => {
    if (roomData) {
      setRoom(roomData.room);
      setMessages(roomData.messages);
      setConnectedSockets(roomData.connectedSockets);
      setUsers(roomData.users);
      setSettings(roomData.settings);
      setLoading(false);
    }
    // Manejar errores de la query
    else if (roomDataError) {
      console.error("Error fetching room data:", roomDataError);
      setLoading(false);
    }
  }, [roomData, roomDataError]);

  // Otra conversación no hereda la cuenta de la anterior.
  useEffect(() => {
    setRoomPatch(null);
  }, [roomId]);

  // La room como la ve la pantalla: lo que vino de la API más lo que avisó el
  // socket después.
  const roomVisible = useMemo(
    () => (room ? { ...room, ...(roomPatch ?? {}) } : null),
    [room, roomPatch]
  );

  // Conectar al socket
  useEffect(() => {
    const socketInstance = io(API_ENDPOINTS.socket, {
      withCredentials: true,
      transports: ["websocket", "polling"], // Priorizar websocket, fallback a polling
      upgrade: true, // Permitir upgrade de polling a websocket
      rememberUpgrade: true, // Recordar si funcionó websocket
      timeout: 20000, // Timeout más largo para conexiones lentas
      forceNew: false, // Reutilizar conexiones existentes
    });

    if (!room) return;

    socketInstance.on("connect", () => {
      const onSocket = socketOn({
        socketInstance,
        roomId,
        users,
        setConnected,
        setCurrentUser,
        phone,
        isAdmin,
        messagesRoom,
      });
      onSocket();
    });

    socketInstance.on("connect_error", (error) => {
      console.log("Error de conexión:", error.message);
    });

    socketInstance.on("disconnect", () => {
      const offSocket = socketOff({
        setConnected,
        setConnectedSockets,
      });
      offSocket();
    });

    socketInstance.on("chat-message", (mensaje: Message) => {
      setBotEscribiendo(false);
      socketChatMessage({ setMessages, setLocalMessages, currentUser })(mensaje);
    });

    socketInstance.on(
      "room-users",
      socketRoomUsers({
        setConnectedSockets,
        room,
        phone,
      })
    );

    // "Escribiendo…" del bot. Si por lo que sea no llega el aviso de que
    // terminó, se apaga solo a los 25 s para no dejar los puntitos colgados.
    let apagarTipeo: ReturnType<typeof setTimeout> | undefined;
    socketInstance.on("bot-typing", (data: { roomId?: string; typing?: boolean }) => {
      if (data?.roomId && data.roomId !== roomId) return;
      clearTimeout(apagarTipeo);
      setBotEscribiendo(Boolean(data?.typing));
      if (data?.typing) {
        apagarTipeo = setTimeout(() => setBotEscribiendo(false), 25000);
      }
    });

    // La automation entrega la cuenta y cambia la room del lado del servidor.
    // La room se pide una sola vez al entrar, así que sin este aviso el jugador
    // tenía que recargar para que la UI se enterara de que ya tiene usuario.
    socketInstance.on(
      "room-updated",
      (data: Partial<Room> & { roomId?: string }) => {
        if (!data) return;
        if (data.roomId && data.roomId !== roomId) return;
        const { roomId: _sala, ...cambios } = data;
        setRoomPatch((previo) => ({ ...previo, ...cambios }));
      }
    );

    setSocket(socketInstance);

    return () => {
      clearTimeout(apagarTipeo);
      socketInstance.disconnect();
    };
  }, [roomId, users, currentUser, phone, room, isAdmin, messagesRoom]);

  // Doble check real: escucha los cambios de estado y confirma la lectura
  // cuando esta conversación está abierta y la pestaña visible.
  useMessageStatus({
    socket,
    roomId,
    isAdmin,
    messages,
    setMessages,
  });

  // Función para enviar mensajes
  const sendMessage = sendChatMessage({
    isAdmin,
    socket: socket!,
    roomId,
    newMessage,
    phone,
    room,
    currentUser,
    setNewMessage,
    setLocalMessages,
  });

  // Función para enviar mensajes personalizados (para atajos)
  const sendCustomMessage = useCallback(
    (message: string) => {
      if (!socket || !message.trim()) return;

      const connectedUser = currentUser || {
        socketId: socket.id,
        _id: "unknown",
      };

      socket.emit("chat-message", {
        roomId,
        message: message,
        phone: phone,
        username: phone || room?.phone,
        socketId: connectedUser.socketId,
        userId: connectedUser._id,
        type: "text",
        read: isAdmin ? true : false, // Los mensajes de admin se envían como leídos
        sender: isAdmin ? "admin" : "user",
      });
    },
    [socket, roomId, phone, room, currentUser, isAdmin]
  );

  // Enviar mensaje de bienvenida cuando un usuario 'user' entra por primera vez
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sendImage = sendImageMessage({
      isAdmin,
      socket,
      roomId,
      phone,
      room,
      currentUser,
      setIsUploadingImage,
      fileInputRef,
      file,
    });
    await sendImage();
  };

  // Funciones para drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Solo quitar el estado si estamos dejando el área del drop zone
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      console.warn('Solo se permiten archivos de imagen');
      return;
    }

    // Procesar la imagen arrastrada
    const sendImage = sendImageMessage({
      isAdmin,
      socket,
      roomId,
      phone,
      room,
      currentUser,
      setIsUploadingImage,
      fileInputRef,
      file,
    });
    await sendImage();
  };

  // Renderizar el loading
  if (loading || isLoadingRoomData) {
    return <LoadingChat />;
  }

  // Renderizar el error
  if (roomDataError) {
    return <ErrorCard />;
  }

  // Renderizar el not found
  if (!room) {
    return <NotFound />;
  }

  // Después del guard, `room` ya no es null: el `??` es para que TypeScript lo
  // sepa, no porque `roomVisible` pueda faltar acá.
  const salaEnPantalla = roomVisible ?? room;

  return (
    <div
      className={`h-[100dvh] bg-[#0b141a] flex flex-col safe-area ${
        isInIframe
          ? "w-full"
          : onBack
          ? "w-full max-w-4xl mx-auto"
          : "max-w-md mx-auto"
      }`}
    >
      <HeaderChat
        isAdmin={isAdmin}
        phone={phone}
        room={salaEnPantalla}
        connectedUsers={connectedUsers}
        socket={socket}
      />

      <WhatsAppCta
        settings={settings}
        isAdmin={isAdmin}
        room={salaEnPantalla}
        messages={[...messages, ...localMessages]}
      />

      <div
        ref={dropZoneRef}
        className="flex-1 flex flex-col overflow-hidden relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23182229' fillOpacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: "#0b141a",
        }}
      >
        {/* Superposición de drag & drop */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-blue-200 text-4xl mb-2">📎</div>
              <p className="text-blue-200 font-medium">Suelta la imagen aquí</p>
              <p className="text-blue-300 text-sm">Se enviará automáticamente</p>
            </div>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-2 custom-scrollbar"
        >
          {messages.length === 0 ? (
            <EmptyChat />
          ) : (
            <Messages
              room={salaEnPantalla}
              settings={settings}
              messages={messages}
              localMessages={localMessages}
              phone={phone}
              isAdmin={isAdmin}
              onBack={onBack}
              users={users}
            />
          )}

          {botEscribiendo && (
            <TypingIndicator nombre={!isAdmin ? settings?.displayName : "Automation"} />
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="bg-[#202c33] px-4 py-2 flex-shrink-0">
          <div className="flex items-end gap-2">
            <InputChat
              isAdmin={isAdmin}
              roomId={roomId}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessage={sendMessage}
              sendCustomMessage={sendCustomMessage}
              connected={connected}
              fileInputRef={fileInputRef}
              isUploadingImage={isUploadingImage}
            />

            {newMessage.trim() ? (
              <Button
                onClick={sendMessage}
                disabled={!connected}
                size="sm"
                className="w-12 h-12 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white p-0 flex items-center justify-center"
              >
                <Send className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-12 h-12 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white p-0 flex items-center justify-center"
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Input file oculto para seleccionar imágenes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
