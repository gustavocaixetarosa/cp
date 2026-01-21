import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Configuração para produção
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
