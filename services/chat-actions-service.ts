// Acciones que el jugador dispara tocando un botón del chat.
// Pegan directo contra la API (no contra /api/accounts del front): son endpoints
// públicos y acotados, no tocan la ACCOUNTS_API_KEY.

import { API_ENDPOINTS } from "@/lib/api-config"

export class ChatActionError extends Error {
  code?: string
  status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ChatActionError"
    this.status = status
    this.code = code
  }
}

async function postear<T>(path: string, body: Record<string, unknown>): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_ENDPOINTS.chatActions}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new ChatActionError(
      `No se pudo contactar al servidor: ${(error as Error).message}`,
      0,
      "SIN_CONEXION"
    )
  }

  const texto = await res.text()
  let data: Record<string, unknown> = {}
  try {
    data = texto ? JSON.parse(texto) : {}
  } catch {
    data = {}
  }

  if (!res.ok) {
    throw new ChatActionError(
      (data.error as string) || `Error ${res.status}`,
      res.status,
      data.code as string | undefined
    )
  }

  return data as T
}

export interface ClaimResult {
  ok: boolean
  reutilizada: boolean
  plataforma: string
  usuario: string
}

export class ChatActionsService {
  /** Botón "Quiero usuario y bono": entrega una cuenta del pool. */
  static claimAccount(roomId: string, responseId: string) {
    return postear<ClaimResult>("/claim-account", { roomId, responseId })
  }

  /** Botón "CBU para depositar": manda los datos de cobro del perfil. */
  static paymentInfo(roomId: string) {
    return postear<{ ok: boolean; mensaje: string }>("/payment-info", { roomId })
  }
}
