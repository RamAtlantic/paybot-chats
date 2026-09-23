/**
 * La bandeja del operador: todo lo que el agente deja para que lo mire alguien.
 * Siempre contra `/api/inbox` (el route handler), nunca contra la API directo.
 */

export interface InboxResumen {
  tareasAbiertas: number
  cargasPendientes: number
  huecosAbiertos: number
  esperandoStock: number
}

export interface Tarea {
  _id: string
  tipo: "escalamiento" | "comprobante" | "sin_stock" | "otro"
  titulo: string
  detalle: string
  roomId: string | null
  phone: string | null
  prioridad: "alta" | "normal"
  estado: "abierta" | "resuelta"
  veces: number
  createdAt: string
}

export interface Sospecha {
  tipo: string
  detalle: string
  transactionId?: string
}

export interface Carga {
  _id: string
  tipo: string
  estado: "pendiente" | "acreditada" | "rechazada"
  roomId: string
  phone: string | null
  monto: number | null
  moneda: string
  comprobante: { messageId: string | null; url: string | null; hash: string | null }
  lectura: {
    titular: string | null
    cbuDestino: string | null
    banco: string | null
    fechaComprobante: string | null
    confianza: string | null
    observaciones: string | null
  }
  sospechas: Sospecha[]
  createdAt: string
}

export interface Hueco {
  _id: string
  pregunta: string
  veces: number
  estado: string
  primeraVez: string
  ultimaVez: string
}

export interface EsperaPlataforma {
  plataforma: string
  esperando: number
  desde: string
}

const BASE = "/api/inbox"

async function parsear<T>(res: Response): Promise<T> {
  const texto = await res.text()
  let data: unknown = null
  try {
    data = texto ? JSON.parse(texto) : null
  } catch {
    throw new Error(texto || `Error ${res.status}`)
  }
  if (!res.ok) throw new Error((data as { error?: string })?.error || `Error ${res.status}`)
  return data as T
}

async function post<T>(ruta: string, body?: unknown): Promise<T> {
  return parsear<T>(
    await fetch(`${BASE}${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    })
  )
}

export const InboxService = {
  async resumen(): Promise<InboxResumen> {
    return parsear<InboxResumen>(await fetch(BASE, { cache: "no-store" }))
  },

  async tareas(estado = "abierta"): Promise<Tarea[]> {
    const d = await parsear<{ tareas: Tarea[] }>(
      await fetch(`${BASE}/tasks?estado=${estado}`, { cache: "no-store" })
    )
    return d.tareas || []
  },

  resolverTarea: (id: string, por?: string) => post(`/tasks/${id}/resolve`, { por }),

  async cargas(estado = "pendiente"): Promise<Carga[]> {
    const d = await parsear<{ cargas: Carga[] }>(
      await fetch(`${BASE}/deposits?estado=${estado}`, { cache: "no-store" })
    )
    return d.cargas || []
  },

  acreditar: (id: string, por?: string, avisar = true) =>
    post(`/deposits/${id}/confirm`, { por, avisar }),

  rechazar: (id: string, por?: string, motivo?: string) =>
    post(`/deposits/${id}/reject`, { por, motivo }),

  async huecos(): Promise<Hueco[]> {
    const d = await parsear<{ huecos: Hueco[] }>(await fetch(`${BASE}/gaps`, { cache: "no-store" }))
    return d.huecos || []
  },

  resolverHueco: (id: string, por?: string) => post(`/gaps/${id}/resolve`, { por }),

  async espera(): Promise<EsperaPlataforma[]> {
    const d = await parsear<{ resumen: EsperaPlataforma[] }>(
      await fetch(`${BASE}/waitlist`, { cache: "no-store" })
    )
    return d.resumen || []
  },

  avisarEspera: (plataforma: string, por?: string) =>
    post<{ avisados: number; salteados: unknown[] }>(`/waitlist/notify`, { plataforma, por }),
}
