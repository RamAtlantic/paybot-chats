import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"

/**
 * Reenvía la request a /api/accounts de la API agregando la ACCOUNTS_API_KEY.
 * Corre solo en el servidor: la clave nunca llega al browser.
 */
export async function proxyAccounts(req: NextRequest, segments: string[] = []) {
  const suffix = segments.length ? `/${segments.join("/")}` : ""
  const url = `${API_BASE_URL}/api/accounts${suffix}${req.nextUrl.search}`

  const headers: Record<string, string> = {}
  const apiKey = process.env.ACCOUNTS_API_KEY
  if (apiKey) headers["x-api-key"] = apiKey

  let body: BodyInit | undefined
  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("multipart/form-data")) {
      // fetch arma su propio boundary a partir del FormData
      body = await req.formData()
    } else {
      headers["Content-Type"] = "application/json"
      body = await req.text()
    }
  }

  try {
    const res = await fetch(url, { method: req.method, headers, body, cache: "no-store" })
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
