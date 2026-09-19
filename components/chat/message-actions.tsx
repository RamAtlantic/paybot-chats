"use client";

import { useState } from "react";
import { Loader2, Check, CreditCard, UserPlus } from "lucide-react";

import { MessageAction } from "@/types/chat";
import { ChatActionsService, ChatActionError } from "@/services/chat-actions-service";
import { toast } from "@/hooks/use-toast";

/**
 * Botones que vienen adentro de un mensaje del bot (type: "interactive").
 * Los toca el jugador; del lado del operador se ven pero no se pueden usar,
 * porque él tiene los atajos /registro-* en el input.
 */
export default function MessageActions({
  actions,
  roomId,
  isAdmin,
}: {
  actions: MessageAction[];
  roomId?: string;
  isAdmin?: boolean;
}) {
  const [enCurso, setEnCurso] = useState<string | null>(null);
  const [listas, setListas] = useState<string[]>([]);

  if (!actions?.length) return null;

  const ejecutar = async (action: MessageAction) => {
    if (isAdmin || enCurso || listas.includes(action.id)) return;

    if (!roomId) {
      toast({
        title: "No se pudo identificar el chat",
        description: "Recargá la página e intentá de nuevo.",
        variant: "destructive",
      });
      return;
    }

    setEnCurso(action.id);
    try {
      if (action.kind === "assign-account") {
        if (!action.responseId) throw new ChatActionError("Opción inválida", 400);
        await ChatActionsService.claimAccount(roomId, action.responseId);
      } else {
        await ChatActionsService.paymentInfo(roomId);
      }
      // El mensaje con el resultado llega solo por Socket.IO.
      setListas((prev) => [...prev, action.id]);
    } catch (error) {
      const esAccion = error instanceof ChatActionError;
      const codigo = esAccion ? error.code : undefined;

      // "Sin stock" ya le llega al jugador como mensaje del bot: no hace falta
      // repetírselo en un cartel de error.
      if (codigo === "SIN_STOCK") {
        setListas((prev) => [...prev, action.id]);
      } else {
        toast({
          title: "No se pudo completar",
          description:
            error instanceof Error ? error.message : "Probá de nuevo en unos segundos.",
          variant: "destructive",
        });
      }
    } finally {
      setEnCurso(null);
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-1.5 border-t border-[#ffffff14] pt-2">
      {actions.map((action) => {
        const cargando = enCurso === action.id;
        const lista = listas.includes(action.id);
        const Icono = action.kind === "payment-info" ? CreditCard : UserPlus;

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => ejecutar(action)}
            disabled={isAdmin || cargando || lista || Boolean(enCurso)}
            title={isAdmin ? "Este botón lo toca el jugador desde su chat" : undefined}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              lista
                ? "bg-[#ffffff0d] text-[#8696a0]"
                : "bg-[#00a884] text-[#0b141a] hover:bg-[#02c39a]"
            } ${isAdmin || cargando || Boolean(enCurso) ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {cargando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : lista ? (
              <Check className="h-4 w-4" />
            ) : (
              <Icono className="h-4 w-4" />
            )}
            <span className="truncate">
              {action.label}
              {action.hint ? ` · ${action.hint}` : ""}
            </span>
          </button>
        );
      })}

      {isAdmin && (
        <p className="text-[10px] leading-tight text-[#8696a0]">
          Botones enviados al jugador — los toca él desde su chat.
        </p>
      )}
    </div>
  );
}
