import React, { useState } from "react";
import { Button } from "../ui/button";
import { UserPlus, Loader2 } from "lucide-react";
import WhatsAppIcon from "./whatsapp-icon";
import { Room } from "@/types/chat";
import { ContactService } from "@/services/contacts-service";
import { useToast } from "@/hooks/use-toast";
import { linkWhatsApp, mensajeDesdeChat, plataformaDeRoom } from "@/lib/whatsapp";

const SectionButton = ({ isAdmin, room, adminphone, displayName }: { isAdmin: boolean, room: Room, adminphone: string, displayName?: string }) => {
  const [isAddingContact, setIsAddingContact] = useState(false);
  const { toast } = useToast();

  const handleAddContact = async () => {
    // Verificar si ya tiene username
    if (room.username && room.username.trim() !== '') {
      toast({
        title: "Contacto ya existe",
        description: "Este contacto ya tiene un nombre de usuario asignado.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingContact(true);
    try {
      const result = await ContactService.validateAndAddContactFromRoom(room);

      if (result.success) {
        toast({
          title: "Contacto agregado",
          description: "El contacto ha sido agregado exitosamente.",
        });
      } else {
        throw new Error(result.message || "Error desconocido");
      }
    } catch (error) {
      console.error("Error al agregar contacto:", error);
      toast({
        title: "Error al agregar contacto",
        description: error instanceof Error ? error.message : "Ha ocurrido un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsAddingContact(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {linkWhatsApp(adminphone) && (
        <Button
          onClick={() => {
            // Si la automation ya le entregó una cuenta, el mensaje de WhatsApp
            // sale con el usuario adentro.
            const cuenta = room.accountId
              ? { usuario: room.username, plataforma: plataformaDeRoom(room.tags) }
              : undefined;
            const url = linkWhatsApp(adminphone, mensajeDesdeChat(displayName, cuenta));
            if (url) window.open(url, "_blank", "noopener,noreferrer");
          }}
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-[#3b4a54] text-[#25D366]"
          title={
            room.accountId && room.username
              ? `Seguir por WhatsApp (usuario ${room.username})`
              : "Seguir por WhatsApp"
          }
        >
          <WhatsAppIcon className="h-5 w-5" />
        </Button>
      )}
      {isAdmin && (
      <Button
        onClick={handleAddContact}
        disabled={isAddingContact}
        variant="ghost"
        size="sm"
        className="p-2 hover:bg-[#3b4a54] text-[#8696a0]"
        title={room.username ? "Contacto ya agregado" : "Agregar contacto"}
      >
        {isAddingContact ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <UserPlus className="h-5 w-5" />
        )}
      </Button>
      )}
    </div>
  );
};

export default SectionButton;
