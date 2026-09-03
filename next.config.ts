import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Forzar el uso de CSS nativo en lugar de dependencias nativas problemáticas
  experimental: {
    clientTraceMetadata: [],
    // Deshabilitar CSS experimental si es necesario
    // css: false,
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-089ca10a84bf4e3e918a62343d7775f8.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig;



  