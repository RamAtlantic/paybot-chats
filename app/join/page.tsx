"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { SettingsData } from "@/types/settings";

export default function JoinPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const formatPhoneNumber = (value: string) => {
    const maxLength = 10;
    let cleaned = value.replace(/\D/g, "");

    // No permitir 0 como primer caracter
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    // Limitar longitud máxima
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }

    return cleaned;
  };

  const searchRoomByPhone = async (phoneNumber: string) => {
    setSearching(true);
    setError(null);
    setFallbackUrl(null);

    try {
      // Remove formatting for API call
      const cleanPhone = phoneNumber.replace(/\D/g, "");

      let finalUrl = "";

      // Try to search for existing room first
      try {
        const searchResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/rooms?phone=${cleanPhone}`
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();

          if (searchData.joinRoom) {
            // Found existing room, use the join URL
            finalUrl = searchData.joinRoom;
          }
        }
      } catch {
        console.log("Search failed, proceeding to create new room...");
      }

      // If search failed or no room found, create a new one
      if (!finalUrl) {

        // Create new room
        const createResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/rooms`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phone: cleanPhone,
              channel: "whatsapp",
              source: "user-join",
              name: `Usuario ${cleanPhone}`,
            }),
          }
        );

        if (createResponse.ok) {
          const createData = await createResponse.json();
          // Generate the join URL from the created room data
          finalUrl = `/chat/${createData.id}?phone=${cleanPhone}`;
        } else {
          const errorData = await createResponse.json().catch(() => ({}));
          setError(errorData.error || "Error al crear la conversación");
          return;
        }
      }

      // Redirect to the chat
      setRedirecting(true);
      setFallbackUrl(finalUrl);

      try {
        // Try router.push first (client-side navigation)
        router.push(finalUrl);
      } catch (redirectError) {
        console.error(
          "Router redirect failed, using window.location:",
          redirectError
        );
        try {
          // Fallback to window.location.href
          window.location.href = finalUrl;
        } catch (fallbackError) {
          console.error("Window.location redirect also failed:", fallbackError);
          // If both fail, keep fallbackUrl for manual redirect button
          setRedirecting(false);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión");
    } finally {
      setSearching(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    await searchRoomByPhone(phone);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
    // Clear previous results when phone changes
    setError(null);
    setRedirecting(false);
    setFallbackUrl(null);
  };

  const handleManualRedirect = () => {
    if (fallbackUrl) {
      window.location.href = fallbackUrl;
    }
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
        setSettings(settingsData);
      } catch (error) {
        console.error("Error al cargar configuración:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  // Fallback redirect timeout - if still redirecting after 3 seconds, show manual button
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (redirecting && fallbackUrl) {
      timeout = setTimeout(() => {
        setRedirecting(false);
      }, 3000); // 3 seconds timeout
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [redirecting, fallbackUrl]);

  return (
    <div className="min-h-screen bg-[#111b21] flex flex-col">
      {/* WhatsApp-style Header */}
      <div className="bg-[#202c33] px-4 py-3 flex items-center justify-center gap-4 border-b border-[#2a3942]">
        <h1 className="text-white text-lg font-medium">Invitación al chat</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Loading State */}
          {loadingSettings && (
            <div className="bg-[#202c33] rounded-lg overflow-hidden">
              <div className="bg-[#0b141a] py-12 flex justify-center">
                <div className="h-32 w-32 bg-[#2a3942] rounded-full animate-pulse"></div>
              </div>
              <div className="px-6 py-6 space-y-4">
                <div className="text-center">
                  <div className="h-8 bg-[#2a3942] rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-[#2a3942] rounded animate-pulse w-24 mx-auto"></div>
                </div>
                <div className="bg-[#0b141a] rounded-lg p-4">
                  <div className="h-16 bg-[#2a3942] rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {/* Main Card - Only show when settings are loaded */}
          {!loadingSettings && (
            <div className="bg-[#202c33] rounded-lg overflow-hidden">
              {/* WhatsApp-style Invitation Card */}
              {/* Avatar Section */}
              {settings && (
                <div className="bg-[#0b141a] py-6 flex justify-center">
                  <Avatar className="h-16 w-16 border-4 border-[#202c33]">
                    <AvatarImage
                      src={
                        settings?.profileImage?.sizes?.original
                          ? `${process.env.NEXT_PUBLIC_PUBLIC_CDN_URL || ""}${
                              settings.profileImage.sizes.original
                            }`
                          : "/casino-logo.png"
                      }
                      alt={settings.displayName}
                    />
                    <AvatarFallback className="bg-[#00a884] text-white text-4xl font-semibold">
                      {(settings?.displayName || "CT").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Info Section */}
              {settings && (
                <div className="px-6 py-6 space-y-4">
                  {/* Name */}
                  <div className="text-center">
                    <h2 className="text-white text-2xl font-medium mb-1">
                      {settings?.displayName || "Casino Terra"}
                    </h2>
                    <p className="text-[#8696a0] text-sm">
                      {settings?.description}
                    </p>
                    {settings?.isConnected !== undefined && (
                      <div>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              settings.isConnected
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <span className="text-xs text-[#8696a0]">
                            {settings.isConnected
                              ? "Conectado"
                              : "Desconectado"}
                          </span>
                        </div>
                        <Link
                          href={settings.platformLink || ""}
                          className="text-xs text-blue-300 hover:text-blue-500"
                        >
                          {settings.platformLink}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {/*   <div className="bg-[#0b141a] rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#00a884] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[#8696a0] text-xs mb-1">Número de contacto</p>
                    <p className="text-white text-sm">+54 9 223 555 8558</p>
                  </div>
                </div>
              </div> */}

                  {/* Phone Input Form */}
                  <form onSubmit={handlePhoneSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <p className="text-[#667781] text-xs">
                        Ingresa tu número y comenza YA
                      </p>
                      <div className="relative">
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="1123456789"
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="bg-[#2a3942] border-[#2a3942] text-white placeholder:text-[#667781] focus:border-[#00a884] focus:ring-[#00a884] h-12 px-4"
                          disabled={searching}
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="bg-[#233138] border border-[#ea4335]/30 rounded-lg p-3">
                        <p className="text-[#ea4335] text-sm">{error}</p>
                      </div>
                    )}

                    {/* Redirecting State */}
                    {redirecting && (
                      <div className="bg-[#0b141a] rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                          <CheckCheck className="h-5 w-5" />
                          <span className="text-sm font-medium">
                            Redirigiendo al chat...
                          </span>
                        </div>
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00a884] border-t-transparent"></div>
                        </div>
                      </div>
                    )}

                    {/* Manual Redirect Button - Fallback */}
                    {fallbackUrl && !redirecting && (
                      <div className="bg-[#0b141a] rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-yellow-400 mb-2">
                          <ExternalLink className="h-5 w-5" />
                          <span className="text-sm font-medium">
                            Redirección automática falló
                          </span>
                        </div>
                        <p className="text-[#8696a0] text-xs mb-3">
                          Haz clic en el botón para ir al chat manualmente.
                        </p>
                        <Button
                          onClick={handleManualRedirect}
                          className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white h-10 text-sm font-medium rounded-lg"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ir al chat
                        </Button>
                      </div>
                    )}

                    {/* Join Button - WhatsApp Style */}
                    <Button
                      type="submit"
                      className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white h-12 text-base font-medium rounded-lg transition-colors"
                      disabled={!phone.trim() || searching || redirecting}
                    >
                      {searching ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                          Buscando conversación...
                        </>
                      ) : redirecting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                          Redirigiendo...
                        </>
                      ) : (
                        <>
                          <CheckCheck className="h-5 w-5 mr-2" />
                          Unirse al chat
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Footer Info */}
                  <div className="pt-4 border-t border-[#2a3942]">
                    <p className="text-[#667781] text-xs text-center leading-relaxed">
                      Tus datos están protegidos y no serán compartidos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
