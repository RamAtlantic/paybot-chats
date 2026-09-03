import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User, ArrowLeft, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-provider";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const copyJoinLink = async () => {
    const link = `${process.env.NEXT_PUBLIC_URL_DEPLOY_VERCEL}/join`;
    try {
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
      toast({
        title: "Enlace copiado",
        description: "El enlace de invitación ha sido copiado al portapapeles",
      });
      // Reset animation after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b border-border/50 bg-card/40 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Flecha izquierda para volver al home */}
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Botones centrales */}
          <div className="flex items-center gap-6">
            <Button
              onClick={() => router.push("/users")}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <User className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => logout()}
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-[white] hover:text-red-500"
            >
              <LogOut className="h-5 w-5" color="red" />
            </Button>
            <Button
              onClick={() => router.push("/settings")}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Botón de copiar enlace */}
          <Button
            onClick={copyJoinLink}
            variant="ghost"
            size="icon"
            className={`rounded-full transition-all duration-200 ${
              isCopied
                ? "bg-green-500/20 text-green-400 scale-110"
                : "hover:bg-primary/20"
            }`}
            title="Copiar enlace de invitación"
          >
            <Copy
              className={`h-5 w-5 transition-transform duration-200 ${
                isCopied ? "scale-110" : ""
              }`}
            />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
