import { NextRequest } from "next/server"
import { proxyAccounts } from "@/lib/accounts-proxy"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  return proxyAccounts(req)
}

export async function POST(req: NextRequest) {
  return proxyAccounts(req)
}
