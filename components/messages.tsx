"use client";

import Image from "next/image";
import React, { useState } from "react";
import { Room, UnifiedMessage, User } from "@/types/chat";
import { isOwnMessage } from "@/lib/utils";
import { SettingsData } from "@/types/settings";
import { Loader2, X } from "lucide-react";
import MessageActions from "./chat/message-actions";
import MessageText from "./chat/message-text";

interface MessagesProps {
  room: Room;
  messages: UnifiedMessage[];
  localMessages?: UnifiedMessage[];
  phone: string | null;
  isAdmin: boolean | undefined;
  onBack?: () => void;
  users: Map<string, User>;
  settings: SettingsData | null;
}

export default function Messages({
  room,
  settings,
  messages,
  localMessages = [],
  phone,
  isAdmin,
  onBack,
  users,
}: MessagesProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Cerrar modal con tecla Escape
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setImagePreview(null);
      }
    };

    if (imagePreview) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [imagePreview]);

  const getMessageUser = (message: UnifiedMessage) => {
    // Try to find user by socketId or userId
    const user =
      users.get(message.socketId || "") || users.get(message.userId || "");
    if (user) {
      return user;
    }
    // If no user found but we have phone, create a virtual user for traceability
    if (message.phone) {
      return {
        _id: message.socketId || message.userId || message._id,
        phone: message.phone,
        rooms: [message.roomId || ""],
        role: "chat-user",
        isConnected: true,
        socketId: message.socketId || "",
        createdAt: message.timestamp,
        updatedAt: message.timestamp,
        connectedAt: message.timestamp,
      };
    }
    return null;
  };

  // Combinar mensajes reales y locales, ordenados por timestamp
  const allMessages = [...messages, ...localMessages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );


  return (
    <div className="space-y-1">
      {allMessages.map((message) => {
        const isOwn = isOwnMessage(message, phone, isAdmin);
        const messageUser = getMessageUser(message);

        return (
          <div
            key={message._id}
            className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}
          >
            <div
              className={`flex items-end gap-2 ${
                onBack ? "max-w-[70%]" : "max-w-[85%]"
              } ${isOwn ? "ml-12 flex-row-reverse" : "mr-12"}`}
            >

              <div className="relative">
                <div
                  className={`px-3 py-2 rounded-lg shadow-sm ${
                    isOwn
                      ? "bg-[#005c4b] text-[#e9edef] rounded-br-sm"
                      : "bg-[#202c33] text-[#e9edef] rounded-bl-sm"
                  }`}
                >
                  {!isOwn && isAdmin && (
                    <p className="text-xs text-[#8696a0] mb-1 font-medium">
                      {room?.username || messageUser?.phone || message.phone }
                    </p>
                  )}
                  {!isOwn && !isAdmin && (
                    <p className="text-xs text-[#8696a0] mb-1 font-medium">
                      {settings?.displayName || ""}
                    </p>
                  )}
                  {message.type === "image" ||
                  message.content.startsWith(
                    process.env.NEXT_PUBLIC_PUBLIC_CDN_URL || ""
                  ) ? (
                    <div className="mt-1">
                      <Image
                        src={message.content}
                        alt="Imagen enviada"
                        width={200}
                        height={200}
                        className="max-w-full max-h-48 rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setImagePreview(message.content)}
                      />
                    </div>
                  ) : (
                    <MessageText
                      content={message.content}
                      className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                    />
                  )}

                  {/* Botones del bot (mensajes con type: "interactive") */}
                  {message.actions && message.actions.length > 0 && (
                    <MessageActions
                      actions={message.actions}
                      roomId={room?._id}
                      isAdmin={isAdmin}
                    />
                  )}

                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-[#8696a0] leading-none">
                      {new Date(message.timestamp).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isOwn && (
                      <div className="flex">
                        {message.sendStatus === "sending" ? (
                          // Reloj giratorio mientras se envía
                          <Loader2 className="h-4 w-4 text-[#8696a0] animate-spin" />
                        ) : message.sendStatus === "sent" ? (
                          // Checks dobles grises cuando se confirma envío
                          <svg
                            width="14"
                            height="10"
                            viewBox="0 0 14 10"
                            className="text-[#8696a0]"
                          >
                            <path
                              fill="currentColor"
                              d="M4.5 7.5L1.5 4.5L0.5 5.5L4.5 9.5L11.5 2.5L10.5 1.5L4.5 7.5Z"
                            />
                            <path
                              fill="currentColor"
                              d="M8.5 7.5L5.5 4.5L4.5 5.5L8.5 9.5L15.5 2.5L14.5 1.5L8.5 7.5Z"
                            />
                          </svg>
                        ) : (
                          // Check gris por defecto (para mensajes antiguos)
                          <svg
                            width="16"
                            height="10"
                            viewBox="0 0 16 10"
                            className="text-[#8696a0]"
                          >
                            <path
                              fill="currentColor"
                              d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.61 3.463c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`absolute top-0 w-0 h-0 ${
                    isOwn
                      ? "right-0 border-l-[8px] border-l-[#005c4b] border-t-[8px] border-t-transparent"
                      : "left-0 border-r-[8px] border-r-[#202c33] border-t-[8px] border-t-transparent"
                  }`}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal de preview de imagen */}
      {imagePreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setImagePreview(null)}
        >
          <div className="relative w-full max-w-lg">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImagePreview(null);
              }}
              className="absolute -top-12 right-0 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full p-2 transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="bg-white rounded-lg p-3 shadow-2xl max-h-[60vh] overflow-auto">
              <Image
                src={imagePreview}
                alt="Preview de imagen"
                width={500}
                height={700}
                className="w-full h-auto object-contain rounded"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
