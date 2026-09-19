"use client"

import { ArrowUpRight } from "lucide-react"

import { linkWhatsApp, mensajeDesdeChat } from "@/lib/whatsapp"
import WhatsAppIcon from "./whatsapp-icon"
import { SettingsData } from "@/types/settings"

/**
 * Barra fija debajo del header del chat del jugador: siempre visible, lleva a
 * WhatsApp con el número cargado en Ajustes y un mensaje ya escrito.
 * No se muestra del lado del operador ni si el perfil no tiene teléfono.
 */
export default function WhatsAppCta({
  settings,
  isAdmin,
}: {
  settings?: SettingsData | null
  isAdmin?: boolean
}) {
  if (isAdmin) return null

  const href = linkWhatsApp(settings?.phone, mensajeDesdeChat(settings?.displayName))
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-shrink-0 items-center gap-3 border-b border-[#2a3942] bg-[#182229] px-4 py-2.5 transition-colors hover:bg-[#202c33] active:bg-[#202c33]"
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00a884]/15">
        <WhatsAppIcon className="h-4 w-4 text-[#00a884]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium leading-tight text-[#e9edef]">
          Escribinos por WhatsApp
        </span>
        <span className="block truncate text-[12px] leading-tight text-[#8696a0]">
          {settings?.displayName
            ? `Seguí la conversación con ${settings.displayName}`
            : "Seguí la conversación desde tu teléfono"}
        </span>
      </span>

      <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-[#00a884] px-3 py-1.5 text-[12px] font-semibold text-[#0b141a] transition-transform group-hover:scale-[1.03]">
        Abrir
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </a>
  )
}
