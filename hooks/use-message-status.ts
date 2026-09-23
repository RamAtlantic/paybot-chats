"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import type { MessageStatus, UnifiedMessage } from "@/types/chat";

interface MessageStatusEvent {
  roomId: string;
  ids: string[];
  status: MessageStatus;
  at: string;
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
  // ¿Hay algo del otro lado sin leer? Se guarda en un ref para que los
  // listeners de foco no trabajen con una foto vieja de los mensajes.
  const hayPendientes = messages.some(
    (m) => m.sender && m.sender !== rol && m.status !== "read"
  );
  const pendientesRef = useRef(hayPendientes);
  pendientesRef.current = hayPendientes;

  useEffect(() => {
    if (!socket || !roomId) return;

    const marcarLeido = () => {
      if (!pendientesRef.current) return;
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
  }, [socket, roomId, rol, hayPendientes]);
}
