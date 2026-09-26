"use client"

import { ArrowUpRight, Check, Lock } from "lucide-react"

import { linkWhatsApp, mensajeDesdeChat, plataformaDeRoom } from "@/lib/whatsapp"
import { isOwnMessage } from "@/lib/utils"
import WhatsAppIcon from "./whatsapp-icon"
import { SettingsData } from "@/types/settings"
import { Room, UnifiedMessage } from "@/types/chat"

/**
 * Barra fija debajo del header del chat del jugador. Tiene dos estados y el
 * salto de uno al otro es el premio de haber completado el circuito:
 *
 *   bloqueado  → todavía le falta el usuario o la primera carga. Se ve qué le
 *                falta, pero NO hay link: el número no se entrega antes.
 *   habilitado → ya tiene cuenta entregada y ya mandó al menos un comprobante.
 *                Recién ahí aparece el botón a WhatsApp con el mensaje escrito.
 *
 * Antes el botón estaba siempre visible y el jugador se iba a WhatsApp sin
 * pasar por el chat: perdíamos el registro de la cuenta y la carga, que es
 * justamente lo único que queremos que quede hecho acá.
 *
 * No se muestra del lado del operador ni si el perfil no tiene teléfono.
 */
export default function WhatsAppCta({
  settings,
  isAdmin,
  room,
  messages,
}: {
  settings?: SettingsData | null
  isAdmin?: boolean
  room?: Room | null
  messages?: UnifiedMessage[]
}) {
  if (isAdmin) return null

  // `accountId` lo deja la automation al entregar la cuenta; `username` de la
  // room pasa a ser el usuario de la plataforma.
  const usuario = room?.accountId ? room?.username?.trim() : ""
  const tieneUsuario = Boolean(usuario)

  // El comprobante es cualquier imagen que haya subido el jugador. Se mira el
  // historial completo que ya vino de la API, así que el acceso sigue abierto
  // si cierra y vuelve a entrar por el mismo link.
  const tieneComprobante = (messages ?? []).some(
    (mensaje) =>
      mensaje.type === "image" && isOwnMessage(mensaje, mensaje.phone ?? null, false)
  )

  const cuenta = usuario
    ? { usuario, plataforma: plataformaDeRoom(room?.tags) }
    : undefined

  const href = linkWhatsApp(
    settings?.phone,
    mensajeDesdeChat(settings?.displayName, cuenta)
  )
  // Sin número cargado en Ajustes no hay nada que prometer ni que desbloquear.
  if (!href) return null

  if (!tieneUsuario || !tieneComprobante) {
    return (
      <LockedCta
        tieneUsuario={tieneUsuario}
        tieneComprobante={tieneComprobante}
      />
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-shrink-0 items-center gap-3 border-b border-[#2a3942] bg-[#182229] px-4 py-2.5 transition-colors hover:bg-[#202c33] active:bg-[#202c33]"
    >
      <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00a884]/15">
        <WhatsAppIcon className="h-4 w-4 text-[#00a884]" />
        <span className="absolute inset-0 animate-ping rounded-full bg-[#00a884]/20" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium leading-tight text-[#e9edef]">
          Acceso desbloqueado · Escribinos por WhatsApp
        </span>
        <span className="block truncate text-[12px] leading-tight text-[#8696a0]">
          {`Vas identificado como ${usuario}`}
        </span>
      </span>

      <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-[#00a884] px-3 py-1.5 text-[12px] font-semibold text-[#0b141a] transition-transform group-hover:scale-[1.03]">
        Abrir
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </a>
  )
}

/**
 * Lo que ve mientras le falta algo: los dos pasos, cuál ya está y cuál no.
 * Es deliberadamente un `div` y no un link: no hay a dónde ir todavía.
 */
function LockedCta({
  tieneUsuario,
  tieneComprobante,
}: {
  tieneUsuario: boolean
  tieneComprobante: boolean
}) {
  const completados = (tieneUsuario ? 1 : 0) + (tieneComprobante ? 1 : 0)

  return (
    <div className="flex-shrink-0 border-b border-[#2a3942] bg-[#182229] px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00a884]/10 ring-1 ring-inset ring-[#00a884]/25">
          <Lock className="h-[15px] w-[15px] text-[#00a884]" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] font-medium leading-tight text-[#e9edef]">
            <WhatsAppIcon className="h-3.5 w-3.5 flex-shrink-0 text-[#00a884]" />
            Desbloqueá el acceso a WhatsApp
          </p>
          <p className="truncate text-[12px] leading-tight text-[#8696a0]">
            Con tu usuario y tu primera carga
          </p>
        </div>

        <span className="flex-shrink-0 rounded-full bg-[#0b141a] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#8696a0]">
          {completados}/2
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <Paso numero={1} listo={tieneUsuario} label="Pedí tu usuario" />
        <span
          className={`h-[2px] w-3 flex-shrink-0 rounded-full ${
            tieneUsuario ? "bg-[#00a884]" : "bg-[#2a3942]"
          }`}
        />
        <Paso numero={2} listo={tieneComprobante} label="Mandá tu comprobante" />
      </div>
    </div>
  )
}

/** Un paso del circuito: en verde con tilde si está hecho, apagado si no. */
function Paso({
  numero,
  listo,
  label,
}: {
  numero: number
  listo: boolean
  label: string
}) {
  return (
    <span
      className={`flex min-w-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[11px] font-medium transition-colors ${
        listo
          ? "bg-[#00a884]/15 text-[#00a884]"
          : "bg-[#0b141a] text-[#8696a0]"
      }`}
    >
      <span
        className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          listo
            ? "bg-[#00a884] text-[#0b141a]"
            : "bg-[#2a3942] text-[#8696a0]"
        }`}
      >
        {listo ? <Check className="h-3 w-3" strokeWidth={3} /> : numero}
      </span>
      <span className="truncate">{label}</span>
    </span>
  )
}
