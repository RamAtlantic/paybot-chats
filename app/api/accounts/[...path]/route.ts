import { NextRequest } from "next/server"
import { proxyAccounts } from "@/lib/accounts-proxy"

export const dynamic = "force-dynamic"

type Contexto = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, ctx: Contexto) {
  const { path } = await ctx.params
  return proxyAccounts(req, path)
}

export async function POST(req: NextRequest, ctx: Contexto) {
  const { path } = await ctx.params
  return proxyAccounts(req, path)
}

export async function PUT(req: NextRequest, ctx: Contexto) {
  const { path } = await ctx.params
  return proxyAccounts(req, path)
}
