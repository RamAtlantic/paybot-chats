import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"

/**
 * Reenvía a /api/chat-actions/operator-message agregando la ACCOUNTS_API_KEY.
 * Es el atajo que el operador dispara a mano y sale como mensaje del bot; a
 * diferencia de los botones del jugador, este endpoint está protegido.
 */
export async function POST(req: NextRequest) {
  const cuerpo = await req.text()

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const apiKey = process.env.ACCOUNTS_API_KEY
  if (apiKey) headers["x-api-key"] = apiKey

  try {
    const res = await fetch(`${API_BASE_URL}/api/chat-actions/operator-message`, {
      method: "POST",
      headers,
      body: cuerpo,
      cache: "no-store",
    })
    const texto = await res.text()
    return new NextResponse(texto, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
    })
  } catch (error) {
    return NextResponse.json(
      { error: `No se pudo contactar a la API: ${(error as Error).message}` },
      { status: 502 }
    )
  }
}
