import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Aquí puedes poner otras opciones experimentales si las necesitas
  },
  // Según el mensaje de error de Next.js, esto debe ir en la raíz para Turbo/Dev
  allowedDevOrigins: ["192.168.1.5:3000", "192.168.1.5"] as any,
};

export default nextConfig;
