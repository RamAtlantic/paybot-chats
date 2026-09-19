// Cliente del pool de cuentas precargadas.
// Siempre pega contra /api/accounts del propio front (route handler), que es el que
// agrega la ACCOUNTS_API_KEY del lado del servidor.

export type AccountStatus = "disponible" | "entregado" | "anulado"

export interface PlatformAccount {
  _id: string
  operador: string
  panel: string
  plataforma: string
  usuario: string
  password?: string
  fechaRegistro: string | null
  status: AccountStatus
  phone: string | null
  roomId: string | null
  contactId: string | null
  deliveredAt: string | null
  deliveredBy: string | null
  createdAt?: string
  updatedAt?: string
}

export interface StockPlataforma {
  plataforma: string
  disponible: number
  entregado: number
  anulado: number
  total: number
  stockBajo: boolean
  sinStock: boolean
}

export interface StockResponse {
  umbral: number
  plataformas: StockPlataforma[]
  totales: { disponible: number; entregado: number; anulado: number; total: number }
}

export interface FilaConProblema {
  fila: number
  motivo?: string
  usuario?: string
  plataforma?: string
}

export interface ImportSummary {
  importBatchId: string
  importedAt: string
  totalFilas: number
  insertados: number
  duplicadosEnArchivo: FilaConProblema[]
  duplicadosEnBase: FilaConProblema[]
  errores: FilaConProblema[]
}

export interface ListAccountsResponse {
  accounts: PlatformAccount[]
  pagination: {
    currentPage: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface AssignResult {
  account: PlatformAccount
  mensaje?: { content: string } | null
  mensajeEnviado?: boolean
  reutilizada: boolean
}

export class AccountsError extends Error {
  code?: string
  status: number
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "AccountsError"
    this.status = status
    this.code = code
  }
}

async function parse<T>(res: Response): Promise<T> {
  const texto = await res.text()
  let data: unknown = null
  try {
    data = texto ? JSON.parse(texto) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    const cuerpo = (data || {}) as { error?: string; code?: string }
    throw new AccountsError(cuerpo.error || `Error ${res.status}`, res.status, cuerpo.code)
  }

  return data as T
}

export interface ListFilters {
  plataforma?: string
  status?: AccountStatus | ""
  operador?: string
  panel?: string
  usuario?: string
  phone?: string
  page?: number
  limit?: number
  includePassword?: boolean
}

export class AccountsService {
  static async getStock(umbral = 10): Promise<StockResponse> {
    const res = await fetch(`/api/accounts/stock?umbral=${umbral}`, { cache: "no-store" })
    return parse<StockResponse>(res)
  }

  static async list(filtros: ListFilters = {}): Promise<ListAccountsResponse> {
    const params = new URLSearchParams()
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== "" && valor !== false) {
        params.append(clave, String(valor))
      }
    })
    const res = await fetch(`/api/accounts?${params.toString()}`, { cache: "no-store" })
    return parse<ListAccountsResponse>(res)
  }

  static async importFile(file: File, operador?: string): Promise<ImportSummary> {
    const form = new FormData()
    form.append("file", file)
    if (operador) form.append("operador", operador)
    const res = await fetch("/api/accounts/import", { method: "POST", body: form })
    return parse<ImportSummary>(res)
  }

  static async assign(datos: {
    roomId: string
    plataforma: string
    template?: string
    deliveredBy?: string
  }): Promise<AssignResult> {
    const res = await fetch("/api/accounts/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    })
    return parse<AssignResult>(res)
  }

  static async release(accountId: string, motivo: string, releasedBy?: string) {
    const res = await fetch(`/api/accounts/${accountId}/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo, releasedBy }),
    })
    return parse<{ account: PlatformAccount }>(res)
  }

  static async update(accountId: string, patch: Partial<Pick<PlatformAccount, "status" | "password" | "operador" | "panel" | "plataforma" | "usuario">>) {
    const res = await fetch(`/api/accounts/${accountId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    return parse<{ account: PlatformAccount }>(res)
  }

  static async getByRoom(roomId: string, includePassword = false) {
    const res = await fetch(`/api/accounts/room/${roomId}?includePassword=${includePassword}`, { cache: "no-store" })
    return parse<{ accounts: PlatformAccount[] }>(res)
  }
}
