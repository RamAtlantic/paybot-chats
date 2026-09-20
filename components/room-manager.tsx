"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, MoreVertical, MessageSquare, Archive, Settings, RefreshCw, X, Check, UserPlus, ArrowLeft, Camera, Filter, Trash2, Bell, BellOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRooms } from "@/hooks/use-rooms"
import { useGlobalSocket } from "@/hooks/use-global-socket"
import { useMessageAlerts } from "@/hooks/use-message-alerts"
import { cn, getLastMessageTime } from "@/lib/utils"
import { RoomService } from "@/services/room-service"
import { ContactService } from "@/services/contacts-service"
import { ContactRequest } from "@/types/contact"
import { WhatsAppAvatar } from "@/lib/utils-render"
import { ConnectedSocket, ExtendedRoom, WhatsAppRoomManagerProps } from "@/types/manager"

// Interfaz temporal para rooms del API
interface ApiRoomData {
  id: string
  _id?: string
  name: string
  phone: string
  channel: string
  source: string
  status: "open" | "closed"
  openedAt?: string
  closedAt?: string
  createdAt: string
  createdFrom: string
  lastConnectionDate?: string
  connectedCount: number
  messageCount: number
  contactId?: string
  username?: string
  tags?: string
  lastMessage?: string
  lastMessageType?: string
  lastMessageSource?: string
  unreadCount?: number
  unreadRoom?: boolean
  connectedSockets: string[]
}
import Link from "next/link"
import { useRouter } from "next/navigation"

export function WhatsAppRoomManager({ onRoomSelected, initialRoomId, initialPhone }: WhatsAppRoomManagerProps) {
  const [selectedRoom, setSelectedRoom] = useState<ExtendedRoom | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [tagFilter, setTagFilter] = useState<string>("all")
  const [showChat, setShowChat] = useState<boolean>(!!initialRoomId)
  const [editingPhone, setEditingPhone] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editingTagValue, setEditingTagValue] = useState<string>("")
  const [savedContacts, setSavedContacts] = useState<Set<string>>(new Set())
  const [iframeRefreshKey, setIframeRefreshKey] = useState<number>(0)
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
  const [roomToDelete, setRoomToDelete] = useState<ExtendedRoom | null>(null)
  const [showArchived, setShowArchived] = useState<boolean>(() => {
    // Leer del localStorage si existe
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-show-archived')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  const { toast } = useToast()
  const router = useRouter()

  // Hook para el socket global
  const { socket, isConnected } = useGlobalSocket()

  // Avisos al operador: sonido, título de la pestaña y notificación del sistema
  const { sonidoActivo, alternarSonido, avisar } = useMessageAlerts()

  // Debug: monitorear cambios en showArchived
  useEffect(() => {
    console.log('showArchived changed to:', showArchived, '- saved to localStorage')
  }, [showArchived])

  // Hook para obtener las salas desde el API
  const { rooms: apiRooms, pagination, loading, error, refetch, refetchSilently, loadMore, hasMore } = useRooms({
    search: searchQuery,
    ...(tagFilter !== "all" && { tags: tagFilter }),
    archived: showArchived,
    autoRefresh: false, // Deshabilitamos el auto-refresh para usar el socket trigger
  })

  // Listener para mensajes globales - dispara refetch cuando llega un nuevo mensaje
  useEffect(() => {
    console.log('useEffect ejecutándose - socket:', !!socket, 'isConnected:', isConnected)

    if (!socket || !isConnected) {
      console.log('Socket no disponible o no conectado, esperando...')
      return
    }

    console.log('Configurando listener para global-message-received')

    const handleGlobalMessageReceived = (data: {
      roomId: string
      messageId: string
      phone: string
      username: string
      type: string
      timestamp: string
      sender?: "user" | "admin" | "bot"
      welcome?: boolean
      preview?: string
    }) => {
      console.log('Nuevo mensaje recibido globalmente:', data)

      // Sólo avisa lo que escribe el jugador: ni los mensajes del operador ni
      // los automáticos del bot. `sender` lo agrega la API; si el evento viene
      // de una versión vieja se cae al username, que al menos separa al bot.
      const esDelJugador = data.sender ? data.sender === "user" : data.username !== "Admin"
      if (esDelJugador && !data.welcome) {
        avisar({
          roomId: data.roomId,
          phone: data.phone,
          username: data.username,
          preview: data.preview,
        })
      }

      // Refrescar las rooms silenciosamente para actualizar contadores de mensajes no leídos
      refetchSilently()
    }

    socket.on('global-message-received', handleGlobalMessageReceived)

    return () => {
      console.log('Removiendo listener para global-message-received')
      socket.off('global-message-received', handleGlobalMessageReceived)
    }
  }, [socket, isConnected, refetchSilently, avisar])

  // Transformar rooms del API a la estructura extendida
  const rooms: ExtendedRoom[] = apiRooms.map((room: ApiRoomData) => {
    console.log('Room from API:', room.id, 'lastMessage:', room.lastMessage, 'lastMessageType:', room.lastMessageType) // Debug
    return {
      id: room.id || room._id || '',
      name: room.name,
      phone: room.phone,
      channel: room.channel,
      source: room.source,
      status: room.status,
      openedAt: room.openedAt,
      closedAt: room.closedAt,
      createdAt: room.createdAt,
      createdFrom: room.createdFrom,
      lastConnectionDate: room.lastConnectionDate,
      connectedCount: room.connectedCount,
      messageCount: room.messageCount,
      contactId: room.contactId,
      username: room.username,
      tags: room.tags,
      lastMessage: room.lastMessage,
      lastMessageType: room.lastMessageType,
      unreadCount: room.unreadCount,
      unreadRoom: room.unreadRoom || false, // Asegurar que unreadRoom esté mapeado
      connectedSockets: Array.isArray(room.connectedSockets) && room.connectedSockets.length > 0 && typeof room.connectedSockets[0] === 'string'
          ? (room.connectedSockets as string[]).map((socketId: string) => ({
            socketId,
            role: 'unknown', // Default role for legacy data - only explicit "user" roles count as connected
            phone: 'unknown',
            isValid: false
          }))
        : (room.connectedSockets as unknown as ConnectedSocket[])
    }
  })

  // Manejar la selección de una sala
  const handleRoomSelect = async (room: ExtendedRoom) => {
    setSelectedRoom(room)
    setShowChat(true)
    onRoomSelected?.(room)

    // Marcar mensajes como leídos cuando se selecciona la sala
    // Nota: Aquí deberías hacer una llamada a la API para marcar los mensajes como leídos
    // y luego refrescar las rooms para actualizar el unreadCount
    if (room.unreadCount && room.unreadCount > 0) {
      // TODO: Implementar llamada a API para marcar mensajes como leídos
      // Por ahora, solo refrescamos las rooms para obtener el estado actualizado
      refetchSilently()
    }
  }

  // Obtener el estado de conexión de una sala
  const getConnectionStatus = (room: ExtendedRoom) => {
    // Solo mostrar conectado cuando hay al menos un socket con role "user"
    const hasUserConnections = room.connectedSockets.some(socket => socket.role === "user")
    return room.status === "open" && hasUserConnections
  }

  // Desconectar un socket de una sala
  const handleDisconnectSocket = async (roomId: string, socketId: string) => {
    try {
      await RoomService.disconnectFromRoom(roomId, socketId, "manual_disconnect")
      toast({
        title: "Socket desconectado",
        description: `Socket ${socketId} desconectado exitosamente de la sala ${roomId}`,
      })
      // Refrescar la lista de salas para actualizar el estado
      refetchSilently()
    } catch (error) {
      toast({
        title: "Error al desconectar socket",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      })
    }
  }

  // Abrir modal de eliminación
  const handleOpenDeleteModal = (room: ExtendedRoom) => {
    setRoomToDelete(room)
    setDeleteModalOpen(true)
  }

  // Cerrar modal de eliminación
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false)
    setRoomToDelete(null)
  }

  // Confirmar eliminación de sala
  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return

    try {
      await RoomService.deleteRoom(roomToDelete.id)
      toast({
        title: "Sala eliminada",
        description: `La conversación con ${roomToDelete.phone} ha sido eliminada exitosamente`,
      })
      // Refrescar la lista de salas para actualizar el estado
      refetchSilently()

      // Si la sala eliminada era la seleccionada, cerrar el chat
      if (selectedRoom?.id === roomToDelete.id) {
        setSelectedRoom(null)
        setShowChat(false)
      }

      handleCloseDeleteModal()
    } catch (error) {
      toast({
        title: "Error al eliminar sala",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      })
    }
  }

  // Manejar click derecho para marcar sala como no leída
  const handleContextMenu = async (e: React.MouseEvent, room: ExtendedRoom) => {
    e.preventDefault() // Prevenir el menú contextual del navegador

    console.log('Click derecho en room:', room.id, 'current unreadRoom:', room.unreadRoom)

    try {
      // Alternar el estado unreadRoom (true -> false, false -> true)
      const newUnreadStatus = !room.unreadRoom

      console.log('Cambiando unreadRoom a:', newUnreadStatus)

      await RoomService.updateUnreadRoomStatus(room.id, newUnreadStatus)

      toast({
        title: newUnreadStatus ? "Sala marcada como no leída" : "Sala marcada como leída",
        description: `La conversación con ${room.username || room.phone} ha sido actualizada`,
      })

      // Pequeño delay para asegurar que la API procese la actualización
      await new Promise(resolve => setTimeout(resolve, 200))

      // Refrescar la lista de salas para actualizar el estado
      await refetch()
    } catch (error) {
      toast({
        title: "Error al actualizar sala",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      })
    }
  }

  // Archivar una sala
  const handleArchiveRoom = async (room: ExtendedRoom) => {
    try {
      await RoomService.archiveRoom(room.id)

      toast({
        title: "Conversación archivada",
        description: `La conversación con ${room.username || room.phone} ha sido archivada exitosamente`,
      })

      // Refrescar la lista de salas para actualizar el estado
      await refetch()
    } catch (error) {
      toast({
        title: "Error al archivar conversación",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      })
    }
  }

  // Toggle entre mostrar conversaciones normales y archivadas
  const handleToggleArchived = () => {
    const newArchivedState = !showArchived
    console.log('Toggling archived mode from', showArchived, 'to', newArchivedState)

    // Limpiar filtros cuando cambiamos de modo
    setTagFilter("all")
    setSearchQuery("")

    // Cambiar el estado y guardar en localStorage
    setShowArchived(newArchivedState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-show-archived', JSON.stringify(newArchivedState))
    }
    console.log('State changed to:', newArchivedState)
  }

  // Iniciar la edición de un contacto
  const handleStartEditing = (room: ExtendedRoom) => {
    setEditingPhone(room.id)
    setEditingValue(room.username || room.phone)
  }

  // Guardar un contacto
  const handleSaveContact = async (room: ExtendedRoom) => {
    if (!editingValue.trim()) return

    try {
      // Siempre actualizar el contacto existente (PUT)
      if (room.contactId) {
        // Si la room ya tiene contactId, actualizar ese contacto
        await ContactService.updateContact(room.contactId, {
          username: editingValue.trim(),
          tags: room.tags || ""
        })

        toast({
          title: "Contacto actualizado",
          description: `El nombre de usuario se cambió a ${editingValue.trim()}`,
        })
      } else {
        // Si no tiene contactId, buscar contacto por teléfono y actualizar
        const validation = await ContactService.validateContact(room.phone)
        if (validation.exists && validation.contact) {
          await ContactService.updateContact(validation.contact._id, {
            username: editingValue.trim(),
            tags: room.tags || ""
          })

          toast({
            title: "Contacto actualizado",
            description: `El nombre de usuario se cambió a ${editingValue.trim()}`,
          })
        } else {
          // Si no existe contacto, crear uno nuevo
          const contactData: ContactRequest = {
            source: room.source,
            phone: room.phone,
            username: editingValue.trim(),
            notes: "",
            tags: room.tags || ""
          }

          await ContactService.createContact(contactData)

          toast({
            title: "Contacto creado",
            description: `El contacto ${editingValue.trim()} ha sido creado exitosamente`,
          })
        }
      }

      // Marcar como contacto guardado
      setSavedContacts(prev => new Set(prev).add(room.id))

      // Refrescar la lista de salas para actualizar el estado
      refetchSilently()

      // Forzar recarga del iframe del chat para mostrar los cambios del contacto
      setIframeRefreshKey(prev => prev + 1)

      setEditingPhone(null)
      setEditingValue("")
    } catch (error) {
      toast({
        title: "Error al guardar contacto",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      })
    }
  }

  // Agregar un contacto
  const handleAddContact = async (room: ExtendedRoom) => {
    try {
      const contactData: ContactRequest = {
        source: room.source,
        phone: room.phone,
        username: room.username || room.phone, // Usando el username del room o phone como fallback
        notes: "",
        tags: room.tags || ""
      }

      // Usar saveContact que valida duplicados y actualiza si existe
      await ContactService.saveContact(contactData, room.contactId)

      // Marcar como contacto guardado
      setSavedContacts(prev => new Set(prev).add(room.id))

      toast({
        title: room.contactId ? "Contacto actualizado" : "Contacto agregado",
        description: `El contacto ${room.phone} ha sido ${room.contactId ? 'actualizado' : 'agregado'} exitosamente`,
      })

      // Refrescar la lista de rooms para mostrar cambios
      await refetchSilently()

      // Forzar recarga del iframe del chat para mostrar los cambios del contacto
      setIframeRefreshKey(prev => prev + 1)
    } catch (error) {
      toast({
        title: "Error al gestionar contacto",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      })
    }
  }

  // Cancelar la edición de un contacto
  const handleCancelEditing = () => {
    setEditingPhone(null)
    setEditingValue("")
  }

  // Iniciar la edición de tags
  const handleStartEditingTag = (room: ExtendedRoom) => {
    setEditingTag(room.id)
    setEditingTagValue(room.tags || "")
  }

  // Guardar tags de un contacto
  const handleSaveTag = async (room: ExtendedRoom) => {
    try {
      if (room.contactId) {
        // Si la room ya tiene contactId, actualizar ese contacto
        await ContactService.updateContact(room.contactId, {
          tags: editingTagValue.trim()
        })

        toast({
          title: "Tags actualizados",
          description: `Los tags se cambiaron a ${editingTagValue.trim() || 'ninguno'}`,
        })
      } else {
        // Si no tiene contactId, buscar contacto por teléfono y actualizar
        const validation = await ContactService.validateContact(room.phone)
        if (validation.exists && validation.contact) {
          await ContactService.updateContact(validation.contact._id, {
            tags: editingTagValue.trim()
          })

          toast({
            title: "Tags actualizados",
            description: `Los tags se cambiaron a ${editingTagValue.trim() || 'ninguno'}`,
          })
        } else {
          // Si no existe contacto, crear uno nuevo
          const contactData: ContactRequest = {
            source: room.source,
            phone: room.phone,
            username: room.username || room.phone,
            notes: "",
            tags: editingTagValue.trim()
          }

          await ContactService.createContact(contactData)

          toast({
            title: "Contacto creado con tags",
            description: `El contacto ${room.phone} ha sido creado con tags: ${editingTagValue.trim() || 'ninguno'}`,
          })
        }
      }

      // Marcar como contacto guardado
      setSavedContacts(prev => new Set(prev).add(room.id))

      // Refrescar la lista de salas para actualizar el estado
      refetchSilently()

      // Forzar recarga del iframe del chat para mostrar los cambios del contacto
      setIframeRefreshKey(prev => prev + 1)

      setEditingTag(null)
      setEditingTagValue("")
    } catch (error) {
      toast({
        title: "Error al guardar tags",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      })
    }
  }

  // Cancelar la edición de tags
  const handleCancelEditingTag = () => {
    setEditingTag(null)
    setEditingTagValue("")
  }
  

  // Función para renderizar el último mensaje
  const renderLastMessage = (room: ExtendedRoom) => {

    if (room.lastMessage) {
      if (room.lastMessageType === 'image') {
        return (
          <div className="flex items-center">
            <Camera className="h-2 w-3 text-[#8696a0]" />
            <span className="text-[#8696a0] text-sm">Foto</span>
          </div>
        )
      }
      return <span className="text-sm text-[#8696a0] max-w-[300px] truncate">{room.lastMessage}</span>
    }
    // Fallback al comportamiento anterior
    return <span className="text-sm text-[#8696a0]">{room.channel} • {room.messageCount} mensajes</span>
  }

  // Usar directamente los resultados de la API, que ya maneja el filtrado por búsqueda
  const filteredRooms = rooms

  // Mostrar errores con toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Error al cargar conversaciones",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  return (
    <div className="flex h-screen bg-[#0b141a] overflow-hidden">
      {/* Sidebar - Lista de conversaciones */}
      <div className="w-[400px] border-r border-[#3b4a54] flex flex-col bg-[#0b141a] h-full">
        {/* Header del sidebar */}
        <div className="p-4 border-b border-[#3b4a54] bg-[#202c33]">
          <div className="flex items-center justify-between mb-4">
            <div>
              
              <Link href="/"className="hover:bg-[#3b4a54] text-[#8696a0]">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-[#e9edef]">
              {showArchived ? "Chats Archivados" : "Chats"}
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { void alternarSonido() }}
                title={
                  sonidoActivo
                    ? "Sonido activado: silenciar los avisos de mensajes nuevos"
                    : "Sonido silenciado: activar los avisos de mensajes nuevos"
                }
                aria-label={sonidoActivo ? "Silenciar avisos" : "Activar avisos"}
                aria-pressed={sonidoActivo}
                className={cn(
                  "hover:bg-[#3b4a54]",
                  sonidoActivo ? "text-[#00a884]" : "text-[#8696a0]"
                )}
              >
                {sonidoActivo ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-[#3b4a54] text-[#8696a0]">
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-[#3b4a54] text-[#8696a0]">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
            <Input
              placeholder="Buscar o empezar un chat nuevo"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#2a3942] border-none text-[#e9edef] placeholder:text-[#8696a0] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>


        <div className="px-4 py-2 bg-[#202c33] border-b border-[#3b4a54]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              

              {/* Tag Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-[#8696a0]" />
                <Select
                  value={tagFilter}
                  onValueChange={(value) => setTagFilter(value)}
                >
                  <SelectTrigger className="h-6 w-[120px] bg-[#2a3942] border-[#3b4a54] text-[#e9edef] text-xs focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Filtrar tags" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a3942] border-[#3b4a54]">
                    <SelectItem value="all" className="text-[#e9edef] focus:bg-[#3b4a54] focus:text-[#e9edef]">
                      Todos
                    </SelectItem>
                    <SelectItem value="ganamos" className="text-[#e9edef] focus:bg-[#3b4a54] focus:text-[#e9edef]">
                      ganamos
                    </SelectItem>
                  </SelectContent>
                </Select>
                {tagFilter !== "all" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTagFilter("all")}
                    className="h-5 w-5 p-0 hover:bg-[#3b4a54] text-[#8696a0] hover:text-[#e9edef]"
                    title="Limpiar filtro"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8696a0]">
                  {pagination ? `${pagination.totalCount} chats ` : "Cargando..."}
                </span>
                {pagination && (
                  <span className="text-[#8696a0]">
                    ({pagination.currentPage}/{pagination.totalPages})
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="h-6 text-xs hover:bg-[#3b4a54] text-[#8696a0]"
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
       {/*  <div className="p-3 border-b border-[#3b4a54] bg-[#0b141a]">
          <div className="flex gap-2">
            <Badge className="cursor-pointer bg-[#00a884] hover:bg-[#008f72] text-white border-none">Todos</Badge>
            <Badge variant="outline" className="cursor-pointer border-[#3b4a54] text-[#8696a0] hover:bg-[#3b4a54]">
              No leídos
            </Badge>
            <Badge variant="outline" className="cursor-pointer border-[#3b4a54] text-[#8696a0] hover:bg-[#3b4a54]">
              Grupos
            </Badge>
          </div>
        </div> */}

        {/* Lista de conversaciones */}
        <ScrollArea className="flex-1 bg-[#0b141a] min-h-0 max-h-full w-full">
          <div className="w-full max-w-[400px]">
            {loading ? (
              <div className="p-4 text-center text-[#8696a0]">
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-4 text-center text-[#8696a0]">No hay conversaciones</div>
            ) : (
              <div className="divide-y divide-[#3b4a54]">
                {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleRoomSelect(room)}
                  onContextMenu={(e) => handleContextMenu(e, room)}
                  className={cn(
                    "flex items-center gap-3 p-3 hover:bg-[#202c33] cursor-pointer transition-colors",
                    selectedRoom?.id === room.id && "bg-[#2a3942]",
                    room.unreadRoom && "bg-orange-500/30 border-l-4 border-orange-500 shadow-md ring-1 ring-orange-500/20",
                  )}
                >
                  {/* Avatar con indicador de conexión */}
                  <div className="relative">
                    <WhatsAppAvatar phone={room.phone} name={room.name} />
                    {/* Indicador de conexión */}
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0b141a]",
                        getConnectionStatus(room) ? "bg-[#00a884]" : "bg-[#8696a0]",
                      )}
                    />
                  </div>

                  {/* Información del chat */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      {editingPhone === room.id ? (
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleSaveContact(room)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveContact(room)
                            } else if (e.key === 'Escape') {
                              handleCancelEditing()
                            }
                          }}
                          className="font-medium text-[#e9edef] bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 truncate"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <h3
                            className="font-medium truncate text-[#e9edef] cursor-text hover:bg-[#3b4a54] px-1 py-0.5 rounded"
                            onClick={() => handleStartEditing(room)}
                          >
                            {room.username || room.phone}
                          </h3>
                          {room.unreadRoom && (
                            <Badge className="text-xs bg-orange-500 hover:bg-orange-600 text-white border-none px-2 py-0.5">
                              Sin leer
                            </Badge>
                          )}
                          {room.tags && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-[#00a884]/20 text-[#00a884] border-[#00a884]/30"
                            >
                              {room.tags}
                            </Badge>
                          )}
                          {savedContacts.has(room.id) && (
                            <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      )}
                      <span className="text-xs text-[#8696a0]">{getLastMessageTime(room)}</span>
                    </div>

                    <div className="flex items-start justify-between">
                      {renderLastMessage(room)}
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1 mt-1">
                      {editingTag === room.id ? (
                        <div className="flex items-center gap-1 w-full">
                          <Input
                            value={editingTagValue}
                            onChange={(e) => setEditingTagValue(e.target.value)}
                            onBlur={() => handleSaveTag(room)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveTag(room)
                              } else if (e.key === 'Escape') {
                                handleCancelEditingTag()
                              }
                            }}
                            className="text-xs text-[#e9edef] bg-[#2a3942] border-[#3b4a54] px-2 py-1 h-6 focus-visible:border-[#00a884] focus-visible:ring-1 focus-visible:ring-[#00a884] truncate flex-1"
                            autoFocus
                            placeholder="Escribe tags separados por comas..."
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveTag(room)
                            }}
                            className="h-6 w-6 p-0 hover:bg-[#00a884] hover:text-white text-[#00a884]"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelEditingTag()
                            }}
                            className="h-6 w-6 p-0 hover:bg-[#ef4444] hover:text-white text-[#8696a0]"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        room.tags ? (
                          <></>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartEditingTag(room)
                            }}
                            className="h-5 px-2 text-xs text-[#8696a0] hover:bg-[#3b4a54] hover:text-[#e9edef] transition-colors"
                          >
                            + Agregar tag
                          </Button>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 ">
                      <div className="flex flex-col gap-1">
                        {room.connectedSockets.filter(socket => socket.role === "user").length > 0 ? (
                          room.connectedSockets
                            .filter(socket => socket.role === "user")
                            .map((socket) => (
                              <div key={socket.socketId} className="flex items-center gap-1">
                                <Badge className="text-xs border-none bg-[#00a884] hover:bg-[#008f72] text-white">
                                  Conectado
                                </Badge>
                                {!room.contactId && (



                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-[#3b4a54] text-[#8696a0] hover:text-green-400"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAddContact(room)
                                  }}
                                  title={`Agregar contacto ${room.phone}`}
                                >
                                  <UserPlus className="h-3 w-3" />
                                </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-[#3b4a54] text-[#8696a0] hover:text-red-400"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDisconnectSocket(room.id, socket.socketId)
                                  }}
                                  title={`Desconectar socket ${socket.socketId}`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                        ) : (
                          <Badge className="text-xs border-none bg-[#3b4a54] text-[#8696a0]">
                            Desconectado
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-[#8696a0]">/ {room.source}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        {/* Indicador de mensajes no leídos */}
                        {(room.unreadCount ?? 0) > 0 && (
                          <div className="bg-[#25d366] text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center border border-[#0b141a] px-1">
                            <span className="text-[10px] font-medium">
                              {(room.unreadCount ?? 0) > 99 ? '99+' : (room.unreadCount ?? 0)}
                            </span>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-[#3b4a54] text-[#8696a0] hover:text-blue-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleArchiveRoom(room)
                          }}
                          title={`Archivar conversación con ${room.phone}`}
                        >
                          <Archive className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-[#3b4a54] text-[#8696a0] hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDeleteModal(room)
                          }}
                          title={`Eliminar conversación con ${room.phone}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón de cargar más */}
          {hasMore && !loading && (
            <div className="p-4 border-t border-[#3b4a54]">
              <Button
                onClick={() => loadMore()}
                variant="outline"
                size="sm"
                className="w-full border-[#3b4a54] text-[#8696a0] hover:bg-[#3b4a54] hover:text-[#e9edef]"
              >
                Cargar más conversaciones
              </Button>
            </div>
          )}
          </div>
        </ScrollArea>


        {/* Footer del sidebar */}
        <div className="p-4.5 border-t border-[#0C141A] bg-[#202c33]">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-[#3b4a54] text-[#8696a0]"
              onClick={handleToggleArchived}
              title={showArchived ? "Ver chats activos" : "Ver chats archivados"}
            >
              {showArchived ? (
                <MessageSquare className="h-5 w-5" />
              ) : (
                <Archive className="h-5 w-5" />
              )}
            </Button>
            <Button onClick={() => router.push("/settings")} variant="ghost" size="icon" className="hover:bg-[#3b4a54] text-[#8696a0]">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Área principal - Chat */}
      <div className="flex-1 flex flex-col bg-[#0b141a] h-full">
        {showChat && (selectedRoom || (initialRoomId && initialPhone)) ? (
          <iframe
            key={iframeRefreshKey}
            src={`/admin/chat/${selectedRoom?.id || initialRoomId}?phone=2235535858`}
            className="w-full h-full border-none"
            title={`Chat con ${selectedRoom?.phone || initialPhone}`}
          />
        ) : (
          /* Estado vacío */
          <div className="flex-1 flex items-center justify-center bg-[#0b141a]">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-[#202c33] flex items-center justify-center">
                <MessageSquare className="h-16 w-16 text-[#8696a0] opacity-50" />
              </div>
              <h3 className="text-2xl font-light mb-2 text-[#e9edef]">WhatsApp Web</h3>
              <p className="text-[#8696a0] max-w-md mb-6">
                Selecciona una conversación para empezar a chatear o mantén tu teléfono conectado.
              </p>
            
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-[#2a3942] border-[#3b4a54] text-[#e9edef]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#e9edef]">
              <Trash2 className="h-5 w-5 text-red-500" />
              Eliminar conversación
            </DialogTitle>
            <DialogDescription className="text-[#8696a0]">
              ¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {roomToDelete && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#202c33] rounded-lg">
                <WhatsAppAvatar phone={roomToDelete.phone} name={roomToDelete.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#e9edef] truncate">
                      {roomToDelete.username || roomToDelete.phone}
                    </h3>
                    {roomToDelete.tags && (
                      <Badge variant="secondary" className="text-xs bg-[#00a884]/20 text-[#00a884] border-[#00a884]/30">
                        {roomToDelete.tags}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#8696a0]">{roomToDelete.phone}</p>
                  <p className="text-xs text-[#8696a0]">{roomToDelete.source}</p>
                  {roomToDelete.lastMessage && (
                    <p className="text-xs text-[#8696a0] mt-1 truncate">
                      Último mensaje: {roomToDelete.lastMessage}
                    </p>
                  )}
                  <p className="text-xs text-[#8696a0]">
                    {roomToDelete.messageCount} mensajes
                  </p>
                </div>
              </div>

              <div className="text-sm text-[#8696a0] bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <strong className="text-red-400">Advertencia:</strong> Se eliminarán permanentemente la conversación y todos sus mensajes asociados.
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCloseDeleteModal}
              className="border-[#3b4a54] text-[#e9edef] hover:bg-[#3b4a54]"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteRoom}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar conversación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}