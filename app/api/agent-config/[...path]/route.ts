import { NextRequest } from "next/server"
import { proxyAgentConfig } from "@/lib/agent-proxy"

export const dynamic = "force-dynamic"

type Contexto = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, ctx: Contexto) {
  const { path } = await ctx.params
  return proxyAgentConfig(req, path)
}

export async function POST(req: NextRequest, ctx: Contexto) {
  const { path } = await ctx.params
  return proxyAgentConfig(req, path)
}

export async function DELETE(req: NextRequest, ctx: Contexto) {
  const { path } = await ctx.params
  return proxyAgentConfig(req, path)
}
