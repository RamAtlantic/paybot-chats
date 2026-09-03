import { Input } from "../ui/input";
import { Smile } from "lucide-react";
import { Button } from "../ui/button";
import { Paperclip } from "lucide-react";
import { handleKeyPress, handleFileSelect } from "@/lib/utils";
import { ResponsesService, ResponseData } from "@/services/responses-service";
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";


interface InputChatProps {
  newMessage: string;
  setNewMessage: (value: string) => void;
  sendMessage: () => void;
  sendCustomMessage?: (message: string) => void;
  connected: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingImage: boolean;
  isAdmin?: boolean;
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
}: InputChatProps) => {
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

  // Filtrar respuestas basado en el texto después del "/"
  const filterResponses = (searchText: string) => {
    if (!searchText.startsWith("/")) {
      setShowShortcuts(false);
      setFilteredResponses([]);
      return;
    }

    const shortcutQuery = searchText.slice(1).toLowerCase(); // Remover el "/" inicial

    let filtered: ResponseData[];
    if (shortcutQuery.length === 0) {
      filtered = allResponses.slice(0, 5); // Mostrar las primeras 5 si no hay búsqueda
    } else {
      filtered = allResponses.filter(response =>
        response.atajo.toLowerCase().includes(shortcutQuery) ||
        response.triggers.some(trigger =>
          trigger.toLowerCase().includes(shortcutQuery)
        )
      ).slice(0, 5); // Limitar a 5 resultados
    }

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

  // Seleccionar una respuesta del atajo
  const selectResponse = (response: ResponseData) => {
    setShowShortcuts(false);

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
              <div className="text-xs text-[#8696a0] mb-2 px-2">Atajos disponibles:</div>
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
                      <span className="text-sm truncate">
                        {response.text ? response.text.slice(0, 50) + (response.text.length > 50 ? "..." : "") :
                         response.image ? "Imagen" : "Contenido mixto"}
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
