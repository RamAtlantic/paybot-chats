import { NextRequest } from "next/server"
import { proxyInbox } from "@/lib/inbox-proxy"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  return proxyInbox(req)
}
