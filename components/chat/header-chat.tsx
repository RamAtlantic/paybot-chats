"use client";

import Image from "next/image";
import type React from "react";
import { Avatar } from "@/lib/utils-render";
import { useSettings } from "@/hooks/use-settings";
import { ConnectedSocket, Room } from "@/types/chat";
import { type Socket } from "socket.io-client";
import SectionButton from "./section-button";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface HeaderChatProps {
  isAdmin?: boolean;
  phone?: string | null | undefined;
  room: Room;
  connectedUsers: ConnectedSocket[];
  socket: Socket | null;
}

export default function HeaderChat({
  isAdmin,
  phone,
  room,
  connectedUsers,
  socket,
}: HeaderChatProps) {
  const { data: settings } = useSettings();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Función para copiar la URL del chat
  const copyChatUrl = async () => {
    if (!phone) return;

    const chatUrl = `${window.location.origin}/chat/${room._id}?phone=${encodeURIComponent(phone)}`;

    console.log("Copiando URL del chat:", chatUrl);
    await navigator.clipboard.writeText(chatUrl);

    setCopied(true);
    toast({
      title: "URL copiada",
      description: `URL del chat copiada: ${chatUrl}`,
    });

    // Resetear el estado después de 2 segundos
    setTimeout(() => setCopied(false), 2000);
  };

  return (
      <div className="bg-[#202c33] border-b border-[#3b4a54] flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {!isAdmin && settings?.profileImage ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#202c33]">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_PUBLIC_CDN_URL || ""}${
                        settings.profileImage.sizes?.original ||
                        settings.profileImage.originalUrl
                      }`}
                      alt={settings.displayName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <Avatar
                    phone={phone || room.phone}
                    username={room.source}
                    size="w-10 h-10"
                  />
                )}
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#202c33] ${(() => {
                    const validConnectedUsers = connectedUsers.filter(
                      (user: ConnectedSocket) =>
                        typeof user.socketId === "object" &&
                        user.socketId?.isValid === true
                    );
                    if (
                      !validConnectedUsers ||
                      validConnectedUsers.length === 0
                    ) {
                      socket?.onAny(
                        (event: string, ...args: ConnectedSocket[]) => {
                          if (event === "room-users") {
                            const validConnectedUsers = args.filter(
                              (user: ConnectedSocket) =>
                                typeof user.socketId === "object" &&
                                user.socketId?.isValid === true
                            );

                            if (
                              validConnectedUsers &&
                              validConnectedUsers.length > 0
                            ) {
                              return "bg-[#ffa500]";
                            }
                          }
                        }
                      );
                      return "bg-[#8696a0]";
                    }
                    return "bg-[#00A884]";
                  })()}`}
                />
              </div>

              <div className="flex-1">
                <h1 className="text-[#e9edef] font-medium text-base leading-tight">
                  {!isAdmin && settings?.displayName
                    ? settings.displayName
                    : isAdmin
                    ? room.username
                      ? room.username
                      : room.phone
                    : room.source}
                </h1>
                {isAdmin && (
                  <p className="text-[#8696a0] text-xs">admin-invite</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón para copiar URL del chat */}
              <Button
                variant="ghost"
                size="sm"
                onClick={copyChatUrl}
                className="h-8 w-8 p-0 hover:bg-[#3b4a54] text-[#8696a0] hover:text-[#e9edef]"
                title="Copiar URL del chat"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>

              <SectionButton
                isAdmin={isAdmin || false}
                room={room}
                adminphone={settings?.phone || ""}
                displayName={settings?.displayName}
              />
            </div>
          </div>
        </div>
      </div>
    );
}
