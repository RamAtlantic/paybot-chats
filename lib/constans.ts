import { Link2, MessageCircle, MessageSquare, Users } from "lucide-react";

export const menuItems = [
    {
      icon: MessageSquare,
      title: "Acceder al Chat",
      description: "Ingresa a tus conversaciones activas",
      path: "/admin",
    },
    {
      icon: Link2,
      title: "Generar Link de Invitación",
      description: "Crea enlaces para invitar usuarios",
      path: "/admin/invite",
    },
    {
      icon: Users,
      title: "Administrar Contactos",
      description: "Gestiona tu lista de contactos",
      path: "/contacts",
    },
    {
      icon: MessageCircle,
      title: "Respuestas Automáticas",
      description: "Configura mensajes automáticos",
      path: "/responses", // O cambiar por otra ruta específica
    },
  ];