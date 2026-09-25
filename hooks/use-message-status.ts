"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import type { MessageStatus, UnifiedMessage } from "@/types/chat";

interface MessageStatusEvent {
  roomId: string;
  ids: string[];
  status: MessageStatus;
  at: string;
}

/**
 * Quién escribió el mensaje. Los mensajes viejos (y los que vienen de
 * WhatsApp) no traen `sender`, así que se deduce.
 */
function senderDe(m: UnifiedMessage): "admin" | "user" {
  if (m.sender === "admin" || m.sender === "user") return m.sender;
  if (m.source === "automation" || m.username === "Admin") return "admin";
  return "user";
}

interface UseMessageStatusParams {
  socket: Socket | null;
  roomId: string;
  isAdmin: boolean | undefined;
  messages: UnifiedMessage[];
  setMessages: React.Dispatch<React.SetStateAction<UnifiedMessage[]>>;
}

/**
 * Doble check real.
 *
 * Hace dos cosas:
 *  1. Escucha `message-status` y actualiza el estado de los mensajes propios
 *     cuando el otro lado los recibe o los lee.
 *  2. Confirma la lectura de los mensajes entrantes, pero sólo cuando esta
 *     conversación está abierta Y la pestaña visible (igual que WhatsApp Web).
 *     Así el panel no marca como leído lo que el operador nunca miró.
 */
export function useMessageStatus({
  socket,
  roomId,
  isAdmin,
  messages,
  setMessages,
}: UseMessageStatusParams) {
  const rol = isAdmin ? "admin" : "user";

  // ---------------------------------------------- 1. recibir cambios de estado
  useEffect(() => {
    if (!socket) return;

    const onStatus = (data: MessageStatusEvent) => {
      if (!data?.roomId || String(data.roomId) !== String(roomId)) return;
      if (!Array.isArray(data.ids) || data.ids.length === 0) return;

      const ids = new Set(data.ids.map(String));

      setMessages((prev) =>
        prev.map((m) => {
          if (!ids.has(String(m._id))) return m;
          // Nunca se retrocede: si ya estaba leído, un "entregado" tardío no lo baja.
          if (m.status === "read") return m;

          return data.status === "read"
            ? {
                ...m,
                status: "read" as MessageStatus,
                readAt: data.at,
                deliveredAt: m.deliveredAt ?? data.at,
                read: true,
              }
            : {
                ...m,
                status: "delivered" as MessageStatus,
                deliveredAt: data.at,
              };
        })
      );
    };

    socket.on("message-status", onStatus);
    return () => {
      socket.off("message-status", onStatus);
    };
  }, [socket, roomId, setMessages]);

  // ------------------------------------------------- 2. confirmar la lectura
  // Cuántos mensajes hay del otro lado. No importa si ya figuran como leídos:
  // el bot puede haberlos marcado (pone los ticks azules) y eso NO baja el
  // badge de sin leer del panel, que sólo baja cuando mira una persona. Si se
  // condiciona el aviso a que queden pendientes, las conversaciones que
  // atendió el bot se quedan con el globito verde para siempre.
  const entrantes = messages.filter((m) => senderDe(m) !== rol).length;

  useEffect(() => {
    if (!socket || !roomId) return;

    const marcarLeido = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      socket.emit("mark-read", { roomId, role: rol });
    };

    marcarLeido();

    document.addEventListener("visibilitychange", marcarLeido);
    window.addEventListener("focus", marcarLeido);

    return () => {
      document.removeEventListener("visibilitychange", marcarLeido);
      window.removeEventListener("focus", marcarLeido);
    };
  }, [socket, roomId, rol, entrantes]);
}
