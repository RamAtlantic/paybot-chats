"use client";

import { Loader2 } from "lucide-react";
import type { MessageStatus } from "@/types/chat";

const GRIS = "#8696a0";
const AZUL = "#53bdeb";

const ETIQUETA: Record<MessageStatus, string> = {
  sending: "Enviando…",
  sent: "Enviado",
  delivered: "Entregado",
  read: "Leído",
};

// Paths de los ticks (viewBox 0 0 16 15).
const TICK_IZQUIERDO =
  "M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.61 3.463c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z";
const TICK_DERECHO =
  "M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51z";

/**
 * Los ticks del mensaje propio. El estado es real: lo manda la API.
 *   reloj        → todavía no confirmó el servidor
 *   ✓  gris      → guardado en la API
 *   ✓✓ gris      → le llegó al otro lado
 *   ✓✓ azul      → el otro lado lo leyó
 */
export default function MessageTicks({ status }: { status: MessageStatus }) {
  if (status === "sending") {
    return (
      <Loader2
        className="h-3 w-3 animate-spin"
        style={{ color: GRIS }}
        aria-label={ETIQUETA.sending}
      />
    );
  }

  const leido = status === "read";
  const doble = status === "delivered" || leido;

  return (
    <svg
      width="16"
      height="15"
      viewBox="0 0 16 15"
      role="img"
      aria-label={ETIQUETA[status]}
      style={{ color: leido ? AZUL : GRIS }}
    >
      <title>{ETIQUETA[status]}</title>
      <path fill="currentColor" d={TICK_IZQUIERDO} />
      {doble && <path fill="currentColor" d={TICK_DERECHO} />}
    </svg>
  );
}
