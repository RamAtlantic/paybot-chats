"use client";

import React from "react";

/**
 * Texto de un mensaje con los links clickeables.
 *
 * Los mensajes del bot traen la URL de la plataforma en el medio del texto
 * (por ejemplo la de Ganamos). Antes se renderizaban como texto plano y el
 * jugador tenía que copiarla a mano; ahora sale como enlace y abre en una
 * pestaña nueva, así no pierde la conversación.
 */

// Corta en los http(s):// y en los www. Se descartan los signos finales
// (punto, coma, paréntesis) para que "entrá en https://ganamosonline.com." no
// se lleve el punto adentro del link.
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.,:;!?)\]}])/gi;

export default function MessageText({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const partes = content.split(URL_REGEX);

  return (
    <p className={className}>
      {partes.map((parte, i) => {
        // split() con grupo de captura deja las coincidencias en los impares.
        if (i % 2 === 1) {
          const href = /^https?:\/\//i.test(parte) ? parte : `https://${parte}`;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()}
              className="text-[#53bdeb] underline underline-offset-2 break-all hover:text-[#7fd0f0]"
            >
              {parte}
            </a>
          );
        }
        return <React.Fragment key={i}>{parte}</React.Fragment>;
      })}
    </p>
  );
}
