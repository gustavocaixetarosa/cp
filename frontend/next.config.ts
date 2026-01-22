import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone apenas em produção (Docker)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  // Configuração para produção
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
