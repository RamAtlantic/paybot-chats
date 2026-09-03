"use client";
import {
  Upload,
  Camera,
  UserCheck,
  FileText,
  Link,
  MessageCircle,
  Phone,
} from "lucide-react";
import type React from "react";
import { ProtectedRoute } from "@/components/layout/protected-route";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { uploadImageToR2, UploadResult } from "@/lib/upload-cdn";
import { useToast } from "@/hooks/use-toast";
import { VantaBackgroundLayout } from "@/components/layout/vanta";

export default function SettingsPage() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string>("/logo.png");
  const [uploadedImageData, setUploadedImageData] =
    useState<UploadResult | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { toast } = useToast();

  // Objeto local para manejar todos los datos del formulario
  const [formData, setFormData] = useState({
    displayName: "",
    platformLink: "",
    description: "",
    welcomeMessage: "",
    phone: "",
  });

  // Función para guardar la configuración
  const handleSaveSettings = async () => {
    const settingsData = {
      profileImage: uploadedImageData
        ? {
            filename: uploadedImageData.filename,
            originalUrl: uploadedImageData.originalUrl,
            sizes: uploadedImageData.sizes,
          }
        : null,
      isConnected,
      ...formData,
      timestamp: new Date().toISOString(),
    };

    setIsSavingSettings(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsData),
        }
      );

      if (!response.ok) {
        throw new Error(`Error al guardar configuración: ${response.status}`);
      }

      toast({
        title: "Configuración guardada",
        description: "Los cambios han sido guardados exitosamente.",
        duration: 2000,
      });

      // Redirigir a la home después de un breve delay para que se vea el toast
      router.push("/");
    } catch (error) {
      console.error("❌ Error al guardar configuración:", error);
      toast({
        title: "Error al guardar",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado. Inténtalo de nuevo.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Función para actualizar el formData
  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  // Cargar configuración al montar el componente
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/settings`
        );

        if (!response.ok) {
          throw new Error(`Error al cargar configuración: ${response.status}`);
        }

        const settingsData = await response.json();

        // Actualizar estados locales con los datos obtenidos
        if (settingsData.profileImage) {
          setUploadedImageData(settingsData.profileImage);
          // Construir URL completa para mostrar la imagen
          const imageUrl =
            settingsData.profileImage.sizes?.original ||
            settingsData.profileImage.sizes?.small ||
            settingsData.profileImage.originalUrl;
          setProfileImage(
            process.env.NEXT_PUBLIC_PUBLIC_CDN_URL
              ? process.env.NEXT_PUBLIC_PUBLIC_CDN_URL + imageUrl
              : "/logo.png"
          );
        }

        setIsConnected(settingsData.isConnected ?? true);

        setFormData({
          displayName: settingsData.displayName || "",
          platformLink: settingsData.platformLink || "",
          description: settingsData.description || "",
          welcomeMessage: settingsData.welcomeMessage || "",
          phone: settingsData.phone || "",
        });
      } catch (error) {
        console.error("❌ Error al cargar configuración:", error);
        toast({
          title: "Error al cargar configuración",
          description:
            error instanceof Error
              ? error.message
              : "Ocurrió un error al cargar los datos. Se usarán valores por defecto.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);

      // Mostrar preview inmediato
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir imagen a R2
      const uploadResult = await uploadImageToR2(file);
      setUploadedImageData(uploadResult);

      // Actualizar la imagen con la URL de R2 (usando tamaño original para mejor calidad/visualización)
      const imageUrl =
        uploadResult.sizes?.original ||
        uploadResult.sizes?.small ||
        uploadResult.originalUrl;
      setProfileImage(
        process.env.NEXT_PUBLIC_PUBLIC_CDN_URL
          ? process.env.NEXT_PUBLIC_PUBLIC_CDN_URL + imageUrl
          : "/logo.png"
      );

     
    } catch (error) {
      console.error("❌ Error al subir imagen:", error);
      toast({
        title: "Error al subir imagen",
        description:
          error instanceof Error
            ? error.message
            : "Error desconocido. Inténtalo de nuevo.",
        variant: "destructive",
      });
      // Resetear a la imagen anterior en caso de error
      setProfileImage("/logo.png");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <ProtectedRoute>
      <VantaBackgroundLayout>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3 text-balance bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(37,211,102,0.5)]">
              Configuración
            </h1>
            <p className="text-emerald-300/90 text-lg text-pretty drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
              Personaliza tu perfil y preferencias
            </p>
          </div>

          {/* Loading State */}
          {isLoadingSettings && (
            <ProtectedRoute>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-emerald-300/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">
                    Cargando configuración...
                  </p>
                </div>
              </div>
            </ProtectedRoute>
          )}

          {/* Settings Card */}
          {!isLoadingSettings && (
            <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-[0_0_30px_rgba(37,211,102,0.3)]">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-emerald-300 to-primary bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(37,211,102,0.5)]">
                  Información del Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Form Fields Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Profile Photo */}
                  <div className="space-y-3 col-span-2 center">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative group mx-auto sm:mx-0">
                        <div className="h-32 w-32 rounded-full overflow-hidden border-3 border-primary/50 group-hover:border-primary group-hover:shadow-[0_0_25px_rgba(37,211,102,0.6)] transition-all">
                          <Image
                            src={profileImage || "/placeholder.svg"}
                            alt="Profile"
                            className="h-full w-full object-cover"
                            width={128}
                            height={128}
                          />
                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          )}
                        </div>
                        <label
                          htmlFor="profile-photo"
                          className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Camera className="h-10 w-10 text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        </label>
                        <input
                          id="profile-photo"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                          disabled={isUploadingImage}
                        />
                      </div>

                      <div className="flex-1 text-center sm:text-left">
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto border-primary/50 hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] transition-all bg-transparent"
                          onClick={() =>
                            document.getElementById("profile-photo")?.click()
                          }
                          disabled={isUploadingImage}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploadingImage ? "Subiendo..." : "Cambiar Foto"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Formatos:
                          <br />
                          JPG, PNG o GIF (máx. 5MB)
                        </p>
                      </div>
                      {/* Connection Status */}
                      <div className="space-y-3 col-span-2 w-[100%] max-w-[350px]">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all w-[100%]">
                          <div className="space-y-1">
                            <Label
                              htmlFor="connection-status"
                              className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)] cursor-pointer"
                            >
                              Estado de Conexión
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {isConnected ? "Conectado" : "Desconectado"}
                            </p>
                          </div>
                          <Switch
                            id="connection-status"
                            checked={isConnected}
                            onCheckedChange={setIsConnected}
                            className="data-[state=checked]:shadow-[0_0_15px_rgba(37,211,102,0.6)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="display-name"
                      className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)] flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4 text-primary" />
                      Nombre a Mostrar
                    </Label>
                    <Input
                      id="display-name"
                      placeholder="Atlantics Developers"
                      value={formData.displayName}
                      onChange={(e) =>
                        updateFormData("displayName", e.target.value)
                      }
                      className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                    />
                  </div>

                  {/* Platform Link */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="platform-link"
                      className="text-emerald-200/90  drop-shadow-[0_0_6px_rgba(16,185,129,0.3)] flex items-center gap-2"
                    >
                      <Link className="h-4 w-4 text-primary" />
                      Enlace a Plataforma
                    </Label>
                    <Input
                      id="platform-link"
                      type="url"
                      placeholder="https://atlantics.dev"
                      value={formData.platformLink}
                      onChange={(e) =>
                        updateFormData("platformLink", e.target.value)
                      }
                      className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                    />
                  </div>

                  {/* Welcome Message */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="welcome-message"
                      className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)] flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4 text-primary" />
                      Mensaje de Bienvenida
                    </Label>
                    <Textarea
                      id="welcome-message"
                      placeholder="Mensaje que verán tus contactos al iniciar una conversación..."
                      rows={3}
                      value={formData.welcomeMessage}
                      onChange={(e) =>
                        updateFormData("welcomeMessage", e.target.value)
                      }
                      className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all resize-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="description"
                      className="text-emerald-200/90 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)] flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describi tu negocio..."
                      rows={1}
                      value={formData.description}
                      onChange={(e) =>
                        updateFormData("description", e.target.value)
                      }
                      className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo 200 caracteres
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="w-[100%] min-w-[300px] flex justify-between items-center">
                  {/* Phone */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="phone"
                      className="text-emerald-200/90 min-w-[200px] drop-shadow-[0_0_6px_rgba(16,185,129,0.3)] flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4 text-primary" />
                      Número de Teléfono
                    </Label>
                    <Input
                      id="phone"
                      placeholder="1123456789"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className="border-primary/30 focus-visible:border-primary focus-visible:shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 w-[100%] max-w-[340px]">
                    <Button
                      variant="outline"
                      className="flex-1 border-primary/50 hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] transition-all bg-transparent"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={isUploadingImage || isSavingSettings}
                      className="flex-1 bg-primary hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(37,211,102,0.6)] transition-all w-[100%] max-w-[300px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingImage
                        ? "Subiendo imagen..."
                        : isSavingSettings
                        ? "Guardando..."
                        : "Guardar Cambios"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </VantaBackgroundLayout>
    </ProtectedRoute>
  );
}
