import { NextRequest } from "next/server"
import { proxyInbox } from "@/lib/inbox-proxy"

export const dynamic = "force-dynamic"

type Contexto = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, ctx: Contexto) {
  const { path } = await ctx.params
  return proxyInbox(req, path)
}

export async function POST(req: NextRequest, ctx: Contexto) {
  const { path } = await ctx.params
  return proxyInbox(req, path)
}
