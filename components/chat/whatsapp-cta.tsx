"use client"

import { ArrowUpRight } from "lucide-react"

import { linkWhatsApp, mensajeDesdeChat } from "@/lib/whatsapp"
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
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#00a884]" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z" />
          <path d="M12.04 2.5c-5.23 0-9.48 4.25-9.48 9.48 0 1.67.44 3.3 1.27 4.74L2.5 21.5l4.92-1.29a9.44 9.44 0 0 0 4.62 1.2h.01c5.22 0 9.47-4.25 9.47-9.48 0-2.53-.99-4.91-2.78-6.7a9.4 9.4 0 0 0-6.7-2.73zm0 17.13h-.01a7.87 7.87 0 0 1-4.01-1.1l-.29-.17-2.92.77.78-2.85-.19-.29a7.85 7.85 0 0 1-1.2-4.2c0-4.34 3.53-7.88 7.88-7.88 2.1 0 4.08.82 5.57 2.31a7.83 7.83 0 0 1 2.31 5.57c0 4.35-3.54 7.88-7.92 7.88z" />
        </svg>
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
