import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/context/query-provider';
import { AuthProvider } from '@/context/auth-provider';
import { Toaster } from '@/components/ui/toast';

const montserrat = Montserrat({ subsets: ["latin"] });

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


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <QueryProvider>
        <AuthProvider>
          <body className={montserrat.className}>
            {children}
            <Toaster />
          </body>
        </AuthProvider>
      </QueryProvider>
    </html>
  );
}