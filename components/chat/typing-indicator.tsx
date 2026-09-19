"use client";

/**
 * Burbuja de "escribiendo…" con los tres puntitos, igual que WhatsApp.
 * Se muestra mientras el bot prepara un mensaje automático (evento `bot-typing`).
 */
export default function TypingIndicator({ nombre }: { nombre?: string | null }) {
  return (
    <div className="mb-1 flex justify-start" aria-live="polite">
      <div className="mr-12 flex max-w-[85%] items-end gap-2">
        <div className="rounded-lg rounded-bl-sm bg-[#202c33] px-3 py-2 shadow-sm">
          {nombre && (
            <p className="mb-1 text-xs font-medium text-[#8696a0]">{nombre}</p>
          )}
          <span className="flex items-center gap-1 py-0.5" role="status">
            <span className="sr-only">Escribiendo…</span>
            <span className="typing-dot size-1.5 rounded-full bg-[#8696a0]" />
            <span className="typing-dot size-1.5 rounded-full bg-[#8696a0]" />
            <span className="typing-dot size-1.5 rounded-full bg-[#8696a0]" />
          </span>
        </div>
      </div>
    </div>
  );
}
