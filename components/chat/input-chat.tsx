import { Input } from "../ui/input";
import { Smile } from "lucide-react";
import { Button } from "../ui/button";
import { Paperclip } from "lucide-react";
import { handleKeyPress, handleFileSelect } from "@/lib/utils";
import { ResponsesService, ResponseData } from "@/services/responses-service";
import { AccountsService } from "@/services/accounts-service";
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Loader2, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-provider";


interface InputChatProps {
  newMessage: string;
  setNewMessage: (value: string) => void;
  sendMessage: () => void;
  sendCustomMessage?: (message: string) => void;
  connected: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingImage: boolean;
  isAdmin?: boolean;
  roomId?: string;
}


const InputChat = ({
  newMessage,
  setNewMessage,
  sendMessage,
  sendCustomMessage,
  connected,
  fileInputRef,
  isUploadingImage,
  isAdmin = false,
  roomId,
}: InputChatProps) => {
  const { user } = useAuth();
  const [ejecutandoAutomation, setEjecutandoAutomation] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [filteredResponses, setFilteredResponses] = useState<ResponseData[]>([]);
  const [allResponses, setAllResponses] = useState<ResponseData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const shortcutsRef = useRef<HTMLDivElement>(null);

  // Cargar todas las respuestas cuando el componente se monta (solo si es admin)
  useEffect(() => {
    if (isAdmin) {
      loadAllResponses();
    }
  }, [isAdmin]);

  const loadAllResponses = async () => {
    try {
      const responses = await ResponsesService.getResponses();
      setAllResponses(responses.filter(r => r.status)); // Solo respuestas activas
    } catch (error) {
      console.error("Error loading responses:", error);
    }
  };

  // Las automations (entregar una cuenta del pool) van primero: son la acción
  // que el operador más busca y antes quedaban escondidas abajo de la lista.
  const ordenarAtajos = (lista: ResponseData[]) =>
    [...lista].sort((a, b) => {
      const pesoA = a.type === "automation" ? 0 : 1;
      const pesoB = b.type === "automation" ? 0 : 1;
      return pesoA - pesoB;
    });

  // Filtrar respuestas basado en el texto después del "/"
  const filterResponses = (searchText: string) => {
    if (!searchText.startsWith("/")) {
      setShowShortcuts(false);
      setFilteredResponses([]);
      return;
    }

    const shortcutQuery = searchText.slice(1).toLowerCase(); // Remover el "/" inicial

    const coincidencias =
      shortcutQuery.length === 0
        ? allResponses
        : allResponses.filter(
            (response) =>
              response.atajo.toLowerCase().includes(shortcutQuery) ||
              response.triggers.some((trigger) =>
                trigger.toLowerCase().includes(shortcutQuery)
              ) ||
              (response.type === "automation" &&
                (response.action?.plataforma || "").toLowerCase().includes(shortcutQuery))
          );

    const filtered = ordenarAtajos(coincidencias).slice(0, 8);

    setFilteredResponses(filtered);
    setShowShortcuts(filtered.length > 0);
    setSelectedIndex(0);
  };

  // Manejar cambios en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (isAdmin) {
      filterResponses(value);
    }
  };

  // Manejar navegación con teclado en el selector de atajos
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showShortcuts) {
      handleKeyPress(e, sendMessage);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredResponses.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case "Enter":
        e.preventDefault();
        if (filteredResponses[selectedIndex]) {
          selectResponse(filteredResponses[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowShortcuts(false);
        break;
      default:
        handleKeyPress(e, () => {}); // No enviar mensaje si hay shortcuts visibles
    }
  };

  // Automations: en vez de mandar texto, piden una cuenta del pool y la API
  // entrega el usuario y la contraseña en el chat.
  const ejecutarAutomation = async (response: ResponseData) => {
    const plataforma = response.action?.plataforma;

    if (!plataforma) {
      toast({
        title: "Automation incompleta",
        description: `El atajo /${response.atajo} no tiene plataforma configurada.`,
        variant: "destructive",
      });
      return;
    }

    if (!roomId) {
      toast({
        title: "No se pudo identificar el chat",
        description: "Abrí la conversación de nuevo e intentá otra vez.",
        variant: "destructive",
      });
      return;
    }

    setEjecutandoAutomation(true);
    try {
      const resultado = await AccountsService.assign({
        roomId,
        plataforma,
        template: response.action?.template,
        deliveredBy: user?.email || "panel",
      });

      if (resultado.reutilizada) {
        toast({
          title: "Este chat ya tenía cuenta",
          description: `Usuario ${resultado.account.usuario} (${plataforma}). No se consumió una cuenta nueva.`,
        });
      } else {
        toast({
          title: `Cuenta entregada: ${resultado.account.usuario}`,
          description: `${plataforma} · quedó asociada a este chat`,
        });
      }

      setNewMessage("");
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error desconocido";
      const sinStock = (error as { code?: string })?.code === "SIN_STOCK";
      toast({
        title: sinStock ? `Sin stock de ${plataforma}` : "No se pudo entregar la cuenta",
        description: sinStock
          ? "No quedan cuentas disponibles. Cargá más desde Registros; mientras tanto podés usar /sin-stock."
          : mensaje,
        variant: "destructive",
      });
    } finally {
      setEjecutandoAutomation(false);
    }
  };

  // Seleccionar una respuesta del atajo
  const selectResponse = (response: ResponseData) => {
    setShowShortcuts(false);

    if (response.type === "automation") {
      void ejecutarAutomation(response);
      return;
    }

    if (!sendCustomMessage) {
      console.error("sendCustomMessage no está disponible");
      return;
    }

    if (response.type === "text" && response.text) {
      // Enviar texto directamente usando sendCustomMessage
      sendCustomMessage(response.text);
    } else if (response.type === "image" && response.image) {
      // Para imágenes, enviar directamente la URL de la imagen
      sendCustomMessage(response.image);
    } else if (response.type === "mixed" && (response.text || response.image)) {
      // Para contenido mixto, enviar el texto si existe, sino la imagen
      const messageContent = response.text || response.image || `[Contenido mixto: ${response.atajo}]`;
      sendCustomMessage(messageContent);
    }
  };

  return (
    <div className="relative flex-1">
      {/* Selector de atajos (se muestra arriba del input) */}
      {showShortcuts && (
        <div
          ref={shortcutsRef}
          className="absolute bottom-full mb-2 left-0 right-0 bg-[#2a3942] border border-[#3b4a54] rounded-lg shadow-lg z-50 max-h-64"
        >
          <ScrollArea className="max-h-64">
            <div className="p-2">
              <div className="text-xs text-[#8696a0] mb-2 px-2">
                Atajos disponibles — seguí escribiendo para filtrar (ej: /registro)
              </div>
              {filteredResponses.map((response, index) => (
                <div
                  key={response._id}
                  onClick={() => selectResponse(response)}
                  className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? "bg-[#00a884] text-white"
                      : "hover:bg-[#3b4a54] text-[#e9edef]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-[#8696a0] text-[#8696a0]">
                        /{response.atajo}
                      </Badge>
                      <span className="text-sm truncate flex items-center gap-1">
                        {response.type === "automation" ? (
                          <>
                            <Zap className="h-3 w-3 text-[#00a884]" />
                            Entregar cuenta de {response.action?.plataforma || "la plataforma"}
                          </>
                        ) : response.text ? (
                          response.text.slice(0, 50) + (response.text.length > 50 ? "..." : "")
                        ) : response.image ? (
                          "Imagen"
                        ) : (
                          "Contenido mixto"
                        )}
                      </span>
                    </div>
                    {response.triggers.length > 0 && (
                      <div className="flex gap-1">
                        {response.triggers.slice(0, 2).map((trigger, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {ejecutandoAutomation && (
        <div className="absolute bottom-full mb-2 left-0 flex items-center gap-2 text-xs text-[#8696a0] bg-[#2a3942] border border-[#3b4a54] rounded-full px-3 py-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Buscando una cuenta disponible...
        </div>
      )}

      {/* Input principal */}
      <div className="w-full bg-[#2a3942] rounded-full flex items-center px-4 py-2 gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-auto hover:bg-[#3b4a54] text-[#8696a0]"
        >
          <Smile className="h-5 w-5" />
        </Button>

        <Input
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Mensaje"
          disabled={!connected}
          className="flex-1 bg-transparent border-none text-[#e9edef] placeholder:text-[#8696a0] focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
        />

        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-auto hover:bg-[#3b4a54] text-[#8696a0]"
          onClick={() => handleFileSelect(fileInputRef)}
          disabled={isUploadingImage || !connected}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default InputChat;
