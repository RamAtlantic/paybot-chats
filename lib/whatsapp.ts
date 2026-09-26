// Armado del link a WhatsApp con el número que está cargado en Ajustes, y la
// regla que decide cuándo el jugador puede verlo.

import { esMensajeDeImagen, isOwnMessage } from "./utils"
import type { Room, UnifiedMessage } from "@/types/chat"

/**
 * Deja el número como lo quiere wa.me: solo dígitos y con código de país.
 * El perfil ya suele tener el formato completo (ej. 5492235535858); si alguien
 * carga el número local argentino (2235535858 / 1123456789) se le agrega 54 9.
 */
export function normalizarTelefono(phone?: string | null): string {
  if (!phone) return ""
  const digitos = phone.replace(/\D/g, "")
  if (!digitos) return ""
  if (digitos.startsWith("54")) return digitos
  if (digitos.length === 10) return `549${digitos}`
  if (digitos.length === 11 && digitos.startsWith("9")) return `54${digitos}`
  return `54${digitos}`
}

export function linkWhatsApp(phone?: string | null, mensaje?: string): string | null {
  const numero = normalizarTelefono(phone)
  if (!numero) return null
  const texto = mensaje?.trim()
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`
}

/**
 * Texto que se abre ya escrito en WhatsApp. Si la persona ya tiene un usuario
 * entregado por la automation, va incluido: así el operador sabe con quién
 * habla sin tener que buscarlo.
 */
export function mensajeDesdeChat(
  displayName?: string | null,
  cuenta?: { usuario?: string | null; plataforma?: string | null }
): string {
  const saludo = displayName
    ? `Hola ${displayName}! Vengo del chat web 👋`
    : "Hola! Vengo del chat web 👋"

  const usuario = cuenta?.usuario?.trim()
  if (!usuario) return saludo

  const plataforma = cuenta?.plataforma?.trim()
  return `${saludo}\nMi usuario es ${usuario}${plataforma ? ` (${plataforma})` : ""}`
}

/** Primera plataforma taggeada en la room (la automation la deja en `tags`). */
export function plataformaDeRoom(tags?: string | null): string {
  if (!tags) return ""
  return tags.split(",").map((t) => t.trim()).filter(Boolean)[0] || ""
}

/* ------------------------------------------------------------------ *
 * Cuándo se le habilita WhatsApp al jugador.
 *
 * Son dos condiciones y viven acá, no en cada componente: el botón del header
 * y la barra del chat tienen que abrirse en el mismo momento, y si la regla
 * estuviera escrita dos veces alcanzaría con tocar una sola para que uno de
 * los dos se adelantara.
 * ------------------------------------------------------------------ */

/** La automation ya le entregó una cuenta y la room quedó con el usuario. */
export function tieneCuentaEntregada(room?: Room | null): boolean {
  return Boolean(room?.accountId && room?.username?.trim())
}

/**
 * Mandó al menos una imagen. Se mira el historial completo que vino de la API,
 * así que el acceso sigue abierto si cierra y vuelve a entrar por el mismo link.
 */
export function hayComprobante(messages?: UnifiedMessage[] | null): boolean {
  return (messages ?? []).some(
    (mensaje) =>
      esMensajeDeImagen(mensaje) && isOwnMessage(mensaje, mensaje.phone ?? null, false)
  )
}

/** Las dos juntas: es lo único que habilita el acceso del lado del jugador. */
export function accesoWhatsAppHabilitado(
  room?: Room | null,
  messages?: UnifiedMessage[] | null
): boolean {
  return tieneCuentaEntregada(room) && hayComprobante(messages)
}
