"use client";
import {
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-provider";
import { VantaBackgroundLayout } from "@/components/layout/vanta";
import { menuItems } from "@/lib/constans";
import { useSettingsDisplay } from "@/hooks/use-settings";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: settings, isLoading } = useSettingsDisplay()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/join");
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-white/80">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <VantaBackgroundLayout>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center flex flex-col items-center justify-center gap-4 mb-8">
            {isLoading ? (
              <>
                {/* Skeleton para la imagen */}
                <div className="w-[150px] h-[150px] bg-gray-700/50 rounded-full animate-pulse" />
                {/* Skeleton para el título */}
                <div className="h-8 bg-gray-700/50 rounded animate-pulse w-48" />
              </>
            ) : (
              <>
                <img
                  src={`${process.env.NEXT_PUBLIC_PUBLIC_CDN_URL}${settings?.profileImage?.originalUrl}` || "/logo.png"}
                  alt="logo"
                  width={100}
                  height={100}
                  className="rounded-full"
                />
                <h1 className="text-3xl font-bold text-white" style={{
                  textShadow: "2px 2px 4px rgba(0, 168, 132, 0.6)",
                }}>
                  {settings?.displayName || "Chat System"}
                </h1>
              </>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Card
                  key={index}
                  className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-border/50 hover:border-primary/70 cursor-pointer bg-card/60 backdrop-blur-xl"
                  onClick={() => router.push(item.path)}
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3
                          className="text-xl font-semibold mb-2"
                          style={{
                            textShadow: "1px 1px 2px rgba(0, 168, 132, 0.4)",
                          }}
                        >
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </VantaBackgroundLayout>
  );
}
