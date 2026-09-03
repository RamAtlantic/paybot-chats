"use client"

import { MessageSquare, Plus, Search, Edit, Trash2, ImageIcon, Type, Power, X, Upload, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ProtectedRoute } from "@/components/layout/protected-route"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ResponsesService, ResponseData, CreateResponseData, UpdateResponseData } from "@/services/responses-service"
import { toast } from "@/hooks/use-toast"
import { uploadImageToR2 } from "@/lib/upload-cdn"
import * as THREE from "three"
import Image from "next/image"
import { VantaBackgroundLayout } from "@/components/layout/vanta"

interface VantaEffect {
  destroy: () => void;
}

interface VantaWavesOptions {
  el: HTMLDivElement;
  THREE: typeof THREE;
  mouseControls: boolean;
  touchControls: boolean;
  gyroControls: boolean;
  minHeight: number;
  minWidth: number;
  scale: number;
  scaleMobile: number;
  color: number;
  shininess: number;
  waveHeight: number;
  waveSpeed: number;
  zoom: number;
}

declare global {
  interface Window {
    VANTA: {
      WAVES: (options: VantaWavesOptions) => VantaEffect;
    };
    THREE: typeof THREE;
  }
}
// Type definitions
type ResponseType = "text" | "image" | "mixed"


export default function ResponsesPage() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<VantaEffect | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("list")
  const [currentTrigger, setCurrentTrigger] = useState("")
  const queryClient = useQueryClient()

  // Form state
  const [formData, setFormData] = useState({
    atajo: "",
    text: "",
    image: "",
    type: "text" as ResponseType,
    status: true,
    triggers: [] as string[],
  })

  // React Query hooks
  const { data: responses = [], isLoading: isLoadingResponses, error: responsesError } = useQuery({
    queryKey: ["responses", searchTerm],
    queryFn: () => ResponsesService.getResponses(searchTerm || undefined),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateResponseData) => ResponsesService.createResponse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses"] })
      toast({
        title: "Éxito",
        description: "Respuesta creada correctamente",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResponseData }) =>
      ResponsesService.updateResponse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses"] })
      toast({
        title: "Éxito",
        description: "Respuesta actualizada correctamente",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Estado para manejo de imagen
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isProcessingUpload, setIsProcessingUpload] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado para modo edición
  const [editingResponse, setEditingResponse] = useState<ResponseData | null>(null)

  useEffect(() => {
    // Load Three.js
    const threeScript = document.createElement("script")
    threeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
    threeScript.async = true
    document.body.appendChild(threeScript)

    threeScript.onload = () => {
      // Load Vanta.js WAVES effect
      const vantaScript = document.createElement("script")
      vantaScript.src = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js"
      vantaScript.async = true
      document.body.appendChild(vantaScript)

      vantaScript.onload = () => {
        if (vantaRef.current && !vantaEffect.current) {
          vantaEffect.current = (window.VANTA as unknown as { WAVES: (options: VantaWavesOptions) => VantaEffect }).WAVES({
            el: vantaRef.current,
            THREE: window.THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0x0a0a0a,
            shininess: 60.0,
            waveHeight: 15.0,
            waveSpeed: 0.6,
            zoom: 0.75,
          })
        }
      
      }
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
      }
    }
  }, [])

  // Service methods
  const handleSaveResponse = async () => {
    if (editingResponse) {
      // Update existing response
      const updateData = {
        atajo: formData.atajo,
        text: formData.text,
        image: formData.image,
        type: formData.type,
        status: formData.status,
        triggers: formData.triggers,
      }

      await updateMutation.mutateAsync({ id: editingResponse._id, data: updateData })

      // Reset edit mode
      setEditingResponse(null)
    } else {
      // Create new response
      const responseData: CreateResponseData = {
        atajo: formData.atajo,
        text: formData.text,
        image: formData.image,
        type: formData.type,
        status: formData.status,
        triggers: formData.triggers,
      }

      await createMutation.mutateAsync(responseData)
    }

    // Reset form on success
    setFormData({
      atajo: "",
      text: "",
      image: "",
      type: "text",
      status: true,
      triggers: [],
    })
    setCurrentTrigger("")
    setActiveTab("list")
  }

  const handleUpdateResponse = async (id: string, data: UpdateResponseData) => {
    await updateMutation.mutateAsync({ id, data })
  }

  const handleDeleteResponse = async (id: string) => {
    // For delete, we'll use update with status: false since the API doesn't have a delete endpoint
    await updateMutation.mutateAsync({ id, data: { status: false } })
  }

  const handleToggleStatus = async (id: string, status: boolean) => {
    await handleUpdateResponse(id, { status })
  }

  // Trigger management functions
  const handleAddTrigger = () => {
    const trigger = currentTrigger.trim()
    if (trigger && !formData.triggers.includes(trigger)) {
      setFormData({
        ...formData,
        triggers: [...formData.triggers, trigger]
      })
      setCurrentTrigger("")
    }
  }

  const handleRemoveTrigger = (triggerToRemove: string) => {
    setFormData({
      ...formData,
      triggers: formData.triggers.filter(trigger => trigger !== triggerToRemove)
    })
  }

  const handleTriggerKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTrigger()
    }
  }

  // Image upload functions
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Evitar procesamiento múltiple
    if (isProcessingUpload) return

    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessingUpload(true)

    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido",
          variant: "destructive",
        })
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no puede superar los 5MB",
          variant: "destructive",
        })
        return
      }

      setIsUploadingImage(true)

      const uploadResult = await uploadImageToR2(file)

      // Usar la URL original de la imagen subida con el CDN
      setFormData({
        ...formData,
        image: `${process.env.NEXT_PUBLIC_PUBLIC_CDN_URL || ""}${uploadResult.originalUrl}`
      })

      toast({
        title: "Éxito",
        description: "Imagen subida correctamente",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir la imagen",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
      setIsProcessingUpload(false)

      // Limpiar el input file después de un pequeño delay para evitar loops
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }, 100)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Edición functions
  const handleEditResponse = (response: ResponseData) => {
    setEditingResponse(response)
    setFormData({
      atajo: response.atajo,
      text: response.text || "",
      image: response.image || "",
      type: response.type,
      status: response.status,
      triggers: [...response.triggers],
    })
    setCurrentTrigger("")
    setActiveTab("create")
  }

  const handleCancelEdit = () => {
    setEditingResponse(null)
    setFormData({
      atajo: "",
      text: "",
      image: "",
      type: "text",
      status: true,
      triggers: [],
    })
    setCurrentTrigger("")
    setActiveTab("list")
  }

  // Loading state
  if (isLoadingResponses) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando respuestas...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Error state
  if (responsesError) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error al cargar las respuestas</div>
            <p className="text-muted-foreground">{responsesError.message}</p>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["responses"] })}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <VantaBackgroundLayout>
    <div ref={vantaRef} className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-primary/10 pointer-events-none z-0" />

      <div className="relative z-10">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Title Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3 text-balance bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(37,211,102,0.5)]">
                Respuestas Automáticas
              </h1>
              <p className="text-emerald-300/90 text-lg text-pretty drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                Gestiona tu biblioteca de respuestas frecuentes
              </p>
            </div>

            {/* Main Card */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-[0_0_30px_rgba(37,211,102,0.3)]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-emerald-300 to-primary bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(37,211,102,0.5)] flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  Biblioteca de Respuestas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="list">Lista</TabsTrigger>
                    <TabsTrigger value="create">{editingResponse ? "Editar" : "Crear"}</TabsTrigger>
                  </TabsList>

                  {/* List Tab */}
                  <TabsContent value="list" className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por atajo, triggers o contenido..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                      />
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-primary/30 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-primary/30 hover:bg-primary/5">
                            <TableHead className="text-emerald-200/90">Atajo</TableHead>
                            <TableHead className="text-emerald-200/90">Tipo</TableHead>
                            <TableHead className="text-emerald-200/90">Contenido</TableHead>
                            <TableHead className="text-emerald-200/90">Triggers</TableHead>
                            <TableHead className="text-emerald-200/90">Estado</TableHead>
                            <TableHead className="text-emerald-200/90 text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {responses.map((response) => (
                            <TableRow
                              key={response._id}
                              className="border-primary/20 hover:bg-primary/5 transition-colors"
                            >
                              <TableCell><span>/{<span className="italic">{response.atajo}</span>}</span></TableCell>
                              <TableCell>
                                <Badge variant={response.type === "text" ? "secondary" : "outline"} className="gap-1">
                                  {response.type === "text" ? (
                                    <Type className="h-3 w-3" />
                                  ) : (
                                    <ImageIcon className="h-3 w-3" />
                                  )}
                                  {response.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {response.type === "text" ? (
                                  <span className="text-sm">{response.text}</span>
                                ) : response.image ? (
                                  <div className="flex items-center gap-2">
                                    <Image
                                      src={response.image}
                                      alt="Preview"
                                      width={40}
                                      height={30}
                                      className="rounded border object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = "/placeholder.svg?height=30&width=40"
                                      }}
                                    />
                                    
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Imagen adjunta</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                {response.triggers.join(", ")}
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={response.status}
                                  onCheckedChange={(checked) => handleToggleStatus(response._id, checked)}
                                  className="data-[state=checked]:shadow-[0_0_15px_rgba(37,211,102,0.6)]"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditResponse(response)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleDeleteResponse(response._id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {responses.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No se encontraron respuestas</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Create Tab */}
                  <TabsContent value="create" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Atajo */}
                      <div className="space-y-3">
                        
                        <Label
                          htmlFor="atajo"
                          className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                        >
                          Atajo
                        </Label>
                        <Input
                          id="atajo"
                          placeholder="/"
                          value={formData.atajo}
                          onChange={(e) => {
                            const value = e.target.value;
                            // No permitir solo "/" como valor
                            if (value === "/") return;
                            setFormData({ ...formData, atajo: value });
                          }}
                          className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all font-bold"
                        />
                        <p className="text-xs text-muted-foreground">Comando para activar la respuesta</p>
                      </div>

                      {/* Type */}
                      <div className="space-y-3">
                        <Label
                          htmlFor="type"
                          className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                        >
                          Tipo
                        </Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: ResponseType) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger className="border-primary/30 focus:border-primary focus:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">
                              <div className="flex items-center gap-2">
                                <Type className="h-4 w-4" />
                                Texto
                              </div>
                            </SelectItem>
                            <SelectItem value="image">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Imagen
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Triggers */}
                      <div className="space-y-3 md:col-span-2">
                        <Label
                          className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                        >
                          Triggers
                        </Label>

                        {/* Display current triggers as badges */}
                        {formData.triggers.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.triggers.map((trigger, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors"
                              >
                                {trigger}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTrigger(trigger)}
                                  className="ml-1 hover:bg-primary/40 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Input for new triggers */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Escribe un trigger y presiona Enter"
                            value={currentTrigger}
                            onChange={(e) => setCurrentTrigger(e.target.value)}
                            onKeyPress={handleTriggerKeyPress}
                            className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddTrigger}
                            disabled={!currentTrigger.trim()}
                            className="border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Palabras clave que activarán esta respuesta automática
                        </p>
                      </div>

                      {/* Content based on type */}
                      {formData.type === "text" ? (
                        <div className="space-y-3 md:col-span-2">
                          <Label
                            htmlFor="text"
                            className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                          >
                            Texto
                          </Label>
                          <Textarea
                            id="text"
                            placeholder="Escribe tu respuesta automática aquí..."
                            rows={6}
                            value={formData.text}
                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all resize-none"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3 md:col-span-2 flex  items-center justify-between">
                          <div>

                          
                          <Label className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                            Imagen
                          </Label>

                          {/* Upload button */}
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={triggerFileInput}
                              disabled={isUploadingImage}
                              className="border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
                            >
                              {isUploadingImage ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Seleccionar imagen
                                </>
                              )}
                            </Button>
                            {formData.image && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData({ ...formData, image: "" })}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          </div>
                          <div>

                         

                          {/* Hidden file input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          {formData.image && (
                            <div className="mt-4 rounded-lg overflow-hidden border border-primary/30 max-w-[300px]">
                              <Image
                                key={formData.image} // Force re-render when image changes
                                src={formData.image}
                                alt="Preview"
                                width={300}
                                height={100}
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=300&width=500"
                                }}
                              />
                            </div>
                          )}

                          {!formData.image && (  
                          <p className="text-xs text-muted-foreground">
                            Formatos soportados: JPG, PNG, GIF, WebP. Tamaño máximo: 5MB
                          </p>
                          )}
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      <div className="space-y-3 md:col-span-2">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all">
                          <div className="space-y-1">
                            <Label
                              htmlFor="status"
                              className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)] cursor-pointer flex items-center gap-2"
                            >
                              <Power className="h-4 w-4 text-primary" />
                              Estado
                            </Label>
                            <p className="text-sm text-muted-foreground">{formData.status ? "Activa" : "Inactiva"}</p>
                          </div>
                          <Switch
                            id="status"
                            checked={formData.status}
                            onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                            className="data-[state=checked]:shadow-[0_0_15px_rgba(37,211,102,0.6)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1 border-primary/50 hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] transition-all bg-transparent"
                        onClick={editingResponse ? handleCancelEdit : () => {
                          setFormData({
                            atajo: "",
                            text: "",
                            image: "",
                            type: "text",
                            status: true,
                            triggers: [],
                          })
                          setCurrentTrigger("")
                          setActiveTab("list")
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(37,211,102,0.6)] transition-all"
                        onClick={handleSaveResponse}
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {(createMutation.isPending || updateMutation.isPending) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          editingResponse ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />
                        )}
                        {(createMutation.isPending || updateMutation.isPending)
                          ? (editingResponse ? "Actualizando..." : "Creando...")
                          : (editingResponse ? "Actualizar Respuesta" : "Crear Respuesta")
                        }
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      </div>
    </VantaBackgroundLayout>
    </ProtectedRoute>
  );
}
