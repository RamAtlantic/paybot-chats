"use client";

import { useParams, useSearchParams } from "next/navigation";
import WhatsAppChat from "@/components/whatsapp-chat";

export default function AdminChatRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const phone = searchParams.get('phone') || undefined;

  // Detectar si estamos en un iframe (no mostrar botón de back)
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return <WhatsAppChat isAdmin={true} roomId={roomId} phone={phone} onBack={isInIframe ? undefined : undefined} />;
}
