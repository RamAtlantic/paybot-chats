/**
 * Cliente de la configuración del agente.
 *
 * Siempre contra `/api/agent-config` (el route handler de Next), nunca contra
 * la API directamente: la clave la agrega el servidor.
 */

export interface AgentConfig {
  claudeKeyConfigurada: boolean
  claudeKeyPreview: string | null
  claudeKeyActualizadaEl: string | null
  modelo: string
  maxTokens: number
  systemPrompt: string
  promptPorDefecto: string
  cifradoDisponible: boolean
  actualizadoEl: string | null
  actualizadoPor: string | null
  activo: boolean
  listoParaActivar: boolean
  /** Variables que faltan en el servidor para que el agente pueda hablar. */
  faltantes: string[]
  /** Horarios de atención. null = sin configurar, y el agente no opina. */
  businessHours: HorariosAtencion | null
  horariosTexto: string | null
  abiertoAhora: boolean | null
}

export interface HorariosAtencion {
  zona: string
  dias: Record<string, string>
}

export const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const

export interface GuardarConfig {
  claudeApiKey?: string
  modelo?: string
  maxTokens?: number
  systemPrompt?: string
  activo?: boolean
  por?: string
  businessHours?: HorariosAtencion | null
}

export interface TestResultado {
  ok: boolean
  modelo?: string
  mensaje: string
  httpStatus?: number
}

export interface AgentRun {
  runId: string
  roomId: string
  phone: string | null
  estado: "despachado" | "entregado" | "fallido" | "respondido"
  intentos: number
  ultimoError: string | null
  disparo: string
  acciones: { tool: string; ok: boolean; at: string }[]
  createdAt: string
}

const BASE = "/api/agent-config"

async function parsear<T>(res: Response): Promise<T> {
  const texto = await res.text()
  let data: unknown = null
  try {
    data = texto ? JSON.parse(texto) : null
  } catch {
    throw new Error(texto || `Error ${res.status}`)
  }
  if (!res.ok) {
    const error = (data as { error?: string })?.error
    throw new Error(error || `Error ${res.status}`)
  }
  return data as T
}

export const AgentService = {
  async get(): Promise<AgentConfig> {
    return parsear<AgentConfig>(await fetch(BASE, { cache: "no-store" }))
  },

  async guardar(datos: GuardarConfig): Promise<AgentConfig> {
    return parsear<AgentConfig>(
      await fetch(BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      })
    )
  },

  /** Sin `claudeApiKey`, prueba la que ya está guardada. */
  async probar(claudeApiKey?: string, modelo?: string): Promise<TestResultado> {
    return parsear<TestResultado>(
      await fetch(`${BASE}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claudeApiKey, modelo }),
      })
    )
  },

  async borrarKey(por?: string): Promise<AgentConfig> {
    return parsear<AgentConfig>(
      await fetch(`${BASE}/key`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ por }),
      })
    )
  },

  async runs(limit = 20): Promise<AgentRun[]> {
    const data = await parsear<{ runs: AgentRun[] }>(
      await fetch(`${BASE}/runs?limit=${limit}`, { cache: "no-store" })
    )
    return data.runs || []
  },
}
