"use client"

/**
 * Avisos para el operador cuando entra un mensaje de un jugador.
 *
 * Tres avisos, de menos a más invasivo:
 *  1. Un sonido corto, sintetizado con WebAudio (no hay archivo que cargar ni
 *     que pueda faltar en el deploy).
 *  2. El título de la pestaña parpadeando mientras el operador está en otra
 *     ventana, con la cantidad de mensajes que se acumularon.
 *  3. La notificación del sistema, si el operador dio permiso.
 *
 * El panel corre dentro de un iframe (`/admin` embebe `/admin/iframe`), así que
 * el título hay que tocarlo en el documento de arriba. Es el mismo origen, pero
 * igual va todo entre try/catch por las dudas.
 *
 * El navegador no deja sonar nada hasta que la persona interactuó con la
 * página: el AudioContext se destraba solo en el primer click o tecla.
 */

import { useCallback, useEffect, useRef, useState } from "react"

const CLAVE_SONIDO = "admin:alertas-sonido"
const TITULO_INTERVALO_MS = 1200

export interface AvisoMensaje {
  roomId: string
  phone?: string
  username?: string
  preview?: string
}

type PermisoNotificacion = "default" | "granted" | "denied" | "unsupported"

/** El documento de la pestaña real, no el del iframe. */
function documentoDePestania(): Document {
  if (typeof window === "undefined") return {} as Document
  try {
    return window.top?.document ?? document
  } catch {
    // Otro origen arriba: se trabaja con el propio.
    return document
  }
}

function leerPreferenciaSonido(): boolean {
  if (typeof window === "undefined") return true
  try {
    const guardado = window.localStorage.getItem(CLAVE_SONIDO)
    return guardado === null ? true : guardado === "true"
  } catch {
    return true
  }
}

export function useMessageAlerts() {
  const [sonidoActivo, setSonidoActivo] = useState<boolean>(true)
  const [permiso, setPermiso] = useState<PermisoNotificacion>("default")

  const audioRef = useRef<AudioContext | null>(null)
  const destrabadoRef = useRef(false)
  const sonidoActivoRef = useRef(true)
  const pendientesRef = useRef(0)
  const tituloOriginalRef = useRef<string | null>(null)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // La preferencia se lee en el cliente para no romper el render del servidor.
  useEffect(() => {
    const valor = leerPreferenciaSonido()
    setSonidoActivo(valor)
    sonidoActivoRef.current = valor
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermiso(Notification.permission as PermisoNotificacion)
    } else {
      setPermiso("unsupported")
    }
  }, [])

  // ------------------------------------------------------------------ sonido

  const contextoAudio = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null
    if (audioRef.current) return audioRef.current
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    try {
      audioRef.current = new Ctor()
      return audioRef.current
    } catch {
      return null
    }
  }, [])

  /** Dos notas cortas, tipo campanita, sin archivo de audio. */
  const reproducirTono = useCallback(() => {
    const ctx = contextoAudio()
    if (!ctx) return
    if (ctx.state === "suspended") void ctx.resume()

    const ahora = ctx.currentTime
    const notas = [
      { frecuencia: 880, inicio: 0, duracion: 0.16 },
      { frecuencia: 1318.5, inicio: 0.13, duracion: 0.28 },
    ]

    for (const nota of notas) {
      const osc = ctx.createOscillator()
      const vol = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = nota.frecuencia

      const t0 = ahora + nota.inicio
      vol.gain.setValueAtTime(0.0001, t0)
      vol.gain.exponentialRampToValueAtTime(0.28, t0 + 0.02)
      vol.gain.exponentialRampToValueAtTime(0.0001, t0 + nota.duracion)

      osc.connect(vol)
      vol.connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + nota.duracion + 0.02)
    }
  }, [contextoAudio])

  // El primer gesto del operador destraba el audio del navegador.
  useEffect(() => {
    if (typeof window === "undefined") return

    const destrabar = () => {
      if (destrabadoRef.current) return
      destrabadoRef.current = true
      const ctx = contextoAudio()
      if (ctx && ctx.state === "suspended") void ctx.resume()
    }

    const opciones = { passive: true } as const
    window.addEventListener("pointerdown", destrabar, opciones)
    window.addEventListener("keydown", destrabar, opciones)
    return () => {
      window.removeEventListener("pointerdown", destrabar)
      window.removeEventListener("keydown", destrabar)
    }
  }, [contextoAudio])

  // ------------------------------------------------- título de la pestaña

  const frenarTitulo = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
    pendientesRef.current = 0
    const doc = documentoDePestania()
    try {
      if (tituloOriginalRef.current !== null) {
        doc.title = tituloOriginalRef.current
        tituloOriginalRef.current = null
      }
    } catch {
      /* el documento de arriba no se deja tocar */
    }
  }, [])

  const parpadearTitulo = useCallback(() => {
    const doc = documentoDePestania()
    try {
      if (!doc.hidden) return
      pendientesRef.current += 1
      if (tituloOriginalRef.current === null) tituloOriginalRef.current = doc.title
      if (intervaloRef.current) return

      let alterno = false
      intervaloRef.current = setInterval(() => {
        alterno = !alterno
        const cantidad = pendientesRef.current
        const etiqueta =
          cantidad === 1 ? "(1) Mensaje nuevo" : `(${cantidad}) Mensajes nuevos`
        try {
          doc.title = alterno ? etiqueta : tituloOriginalRef.current ?? etiqueta
        } catch {
          /* ignorado */
        }
      }, TITULO_INTERVALO_MS)
    } catch {
      /* ignorado */
    }
  }, [])

  // Cuando el operador vuelve a la pestaña, el título se acomoda solo.
  useEffect(() => {
    const doc = documentoDePestania()
    const volver = () => {
      try {
        if (!doc.hidden) frenarTitulo()
      } catch {
        frenarTitulo()
      }
    }
    try {
      doc.addEventListener("visibilitychange", volver)
    } catch {
      /* ignorado */
    }
    window.addEventListener("focus", volver)
    return () => {
      try {
        doc.removeEventListener("visibilitychange", volver)
      } catch {
        /* ignorado */
      }
      window.removeEventListener("focus", volver)
      frenarTitulo()
    }
  }, [frenarTitulo])

  // ----------------------------------------------- notificación del sistema

  const pedirPermiso = useCallback(async (): Promise<PermisoNotificacion> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermiso("unsupported")
      return "unsupported"
    }
    if (Notification.permission !== "default") {
      const actual = Notification.permission as PermisoNotificacion
      setPermiso(actual)
      return actual
    }
    try {
      const resultado = (await Notification.requestPermission()) as PermisoNotificacion
      setPermiso(resultado)
      return resultado
    } catch {
      return "default"
    }
  }, [])

  const notificar = useCallback((aviso: AvisoMensaje) => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return
    const doc = documentoDePestania()
    try {
      if (!doc.hidden) return
    } catch {
      /* si no se puede saber, se notifica igual */
    }
    try {
      const notificacion = new Notification(
        aviso.phone ? `Nuevo mensaje de ${aviso.phone}` : "Nuevo mensaje en el chat",
        {
          body: aviso.preview || "Tocá para abrir la conversación",
          tag: `room-${aviso.roomId}`,
          icon: "/logo.png",
        }
      )
      notificacion.onclick = () => {
        try {
          window.top?.focus()
        } catch {
          window.focus()
        }
        notificacion.close()
      }
    } catch {
      /* ignorado */
    }
  }, [])

  // --------------------------------------------------------------- público

  /** Se llama una vez por mensaje de jugador. */
  const avisar = useCallback(
    (aviso: AvisoMensaje) => {
      if (sonidoActivoRef.current) reproducirTono()
      parpadearTitulo()
      notificar(aviso)
    },
    [notificar, parpadearTitulo, reproducirTono]
  )

  const alternarSonido = useCallback(async () => {
    const proximo = !sonidoActivoRef.current
    sonidoActivoRef.current = proximo
    setSonidoActivo(proximo)
    try {
      window.localStorage.setItem(CLAVE_SONIDO, String(proximo))
    } catch {
      /* ignorado */
    }
    if (proximo) {
      // Se prueba en el mismo gesto que lo activa: así el navegador lo deja
      // sonar y el operador escucha qué le va a llegar.
      reproducirTono()
      await pedirPermiso()
    }
    return proximo
  }, [pedirPermiso, reproducirTono])

  return {
    sonidoActivo,
    alternarSonido,
    probarSonido: reproducirTono,
    permisoNotificaciones: permiso,
    pedirPermisoNotificaciones: pedirPermiso,
    avisar,
  }
}
