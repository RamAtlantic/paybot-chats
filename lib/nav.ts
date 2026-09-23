import {
  Bot,
  IdCard,
  LayoutDashboard,
  Link2,
  MessagesSquare,
  Settings,
  UserCog,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  description: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: "Operación",
    items: [
      {
        label: "Panel",
        description: "Estado general del sistema",
        href: "/",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        label: "Chats",
        description: "Conversaciones activas",
        href: "/admin",
        icon: MessagesSquare,
        exact: true,
      },
      {
        label: "Registros",
        description: "Pool de cuentas por plataforma",
        href: "/registros",
        icon: IdCard,
      },
    ],
  },
  {
    label: "Base",
    items: [
      {
        label: "Contactos",
        description: "Base de jugadores",
        href: "/contacts",
        icon: Users,
      },
      {
        label: "Respuestas",
        description: "Atajos y automatizaciones",
        href: "/responses",
        icon: Zap,
      },
      {
        label: "Invitaciones",
        description: "Generar link de chat",
        href: "/admin/invite",
        icon: Link2,
        exact: true,
      },
    ],
  },
  {
    label: "Agente",
    items: [
      {
        label: "Agente IA",
        description: "Respuestas automáticas con Claude",
        href: "/agente",
        icon: Bot,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        label: "Ajustes",
        description: "Perfil público del chat",
        href: "/settings",
        icon: Settings,
      },
      {
        label: "Usuarios",
        description: "Operadores y permisos",
        href: "/users",
        icon: UserCog,
      },
    ],
  },
]

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items)

export function isActivePath(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
