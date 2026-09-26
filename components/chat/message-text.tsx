"use client";

import React from "react";

/**
 * Texto de un mensaje con los links clickeables y la negrita renderizada.
 *
 * Los mensajes del bot traen la URL de la plataforma en el medio del texto
 * (por ejemplo la de Ganamos). Antes se renderizaban como texto plano y el
 * jugador tenía que copiarla a mano; ahora sale como enlace y abre en una
 * pestaña nueva, así no pierde la conversación.
 *
 * Y el bot escribe en negrita mezclando los dos estilos —`**markdown**` y el
 * `*de WhatsApp*`, a veces en el mismo mensaje—: se soportan los dos, porque
 * si no el jugador ve los asteriscos crudos justo en lo que más importa (el
 * monto, el alias, el usuario).
 */

// Corta en los http(s):// y en los www. Se descartan los signos finales
// (punto, coma, paréntesis) para que "entrá en https://ganamosonline.com." no
// se lleve el punto adentro del link.
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.,:;!?)\]}])/gi;

// `**así**` o `*así*`, en una sola línea. El par doble tolera un asterisco
// suelto adentro (`**Ab*cd**`), porque los passwords que entrega la automation
// pueden tener uno y si no se partía el mensaje al medio. Un asterisco que abre
// y nunca cierra queda como texto, que es lo que se quiere para "3 * 4".
const NEGRITA_REGEX = /\*\*((?:[^*\n]|\*(?!\*))+)\*\*|\*([^*\n]+)\*/g;

/**
 * Convierte los asteriscos en <strong>. Devuelve nodos, no HTML: nada de lo
 * que escriba el jugador o el bot se interpreta como marcado.
 */
function conNegritas(texto: string, prefijo: string): React.ReactNode[] {
  const nodos: React.ReactNode[] = [];
  let ultimoCorte = 0;
  let match: RegExpExecArray | null;

  NEGRITA_REGEX.lastIndex = 0;
  while ((match = NEGRITA_REGEX.exec(texto)) !== null) {
    const contenido = match[1] ?? match[2] ?? "";

    // "hola * chau *" no es negrita: los marcadores tienen que estar pegados
    // al texto. Sin esto, cualquier par de asteriscos sueltos se comería el
    // pedazo de mensaje que quedó en el medio.
    if (contenido !== contenido.trim()) continue;

    if (match.index > ultimoCorte) {
      nodos.push(texto.slice(ultimoCorte, match.index));
    }
    nodos.push(
      <strong key={`${prefijo}-b${match.index}`} className="font-semibold">
        {contenido}
      </strong>
    );
    ultimoCorte = match.index + match[0].length;
  }

  if (ultimoCorte < texto.length) nodos.push(texto.slice(ultimoCorte));
  return nodos;
}

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
        // La negrita se busca solo fuera de los links: un asterisco dentro de
        // una URL es parte de la URL.
        return (
          <React.Fragment key={i}>{conNegritas(parte, String(i))}</React.Fragment>
        );
      })}
    </p>
  );
}
