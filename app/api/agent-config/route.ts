import { NextRequest } from "next/server"
import { proxyAgentConfig } from "@/lib/agent-proxy"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  return proxyAgentConfig(req)
}

export async function PUT(req: NextRequest) {
  return proxyAgentConfig(req)
}
