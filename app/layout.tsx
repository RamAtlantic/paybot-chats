import type { Metadata, Viewport } from 'next'
import { Montserrat, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/context/query-provider'
import { AuthProvider } from '@/context/auth-provider'
import { Toaster } from '@/components/ui/toast'

// Montserrat sigue siendo la fuente del chat de jugadores (no se toca).
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

// Inter + JetBrains Mono son las del panel de operación.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-ui',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SantoCirco - Chat jugadores',
  description: 'Servicio de chat externo para jugadores',
  keywords: ['chat', 'externo', 'jugadores', 'PayBot', 'Atlantics Dev'],
  authors: [{ name: 'Atlantics Dev' }],
  creator: 'Atlantics Dev',
  publisher: 'Atlantics Dev',
  icons: {
    icon: '/logo.ico',
    shortcut: '/logo.ico',
    apple: '/logo.ico',
  },
  openGraph: {
    title: 'Chat Jugadores',
    description: 'Servicio de chat externo para jugadores',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary',
    title: 'Chat Jugadores',
    description: 'Servicio de chat externo para jugadores',
    creator: '@atlanticsdev',
  },
}

export const viewport: Viewport = {
  themeColor: '#0c0d0f',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`dark ${montserrat.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <QueryProvider>
        <AuthProvider>
          <body className="font-sans antialiased">
            {children}
            <Toaster />
          </body>
        </AuthProvider>
      </QueryProvider>
    </html>
  )
}
