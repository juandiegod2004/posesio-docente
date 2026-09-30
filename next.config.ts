import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const isDev = process.env.NODE_ENV !== "production";

// El navegador le habla directo a Supabase Auth (login, reset de contraseña) y
// carga el widget de Cloudflare Turnstile: ambos necesitan permiso explícito en el CSP.
// En dev se relaja script-src/connect-src porque Turbopack/Fast Refresh usa eval y
// websockets al propio origen que un CSP de producción no debería llevar.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // "ws:" (sin host) en vez de "ws://localhost:*": el HMR también se conecta desde
  // la IP de LAN cuando se prueba desde otro dispositivo (ej. celular por wifi).
  `connect-src 'self' ${SUPABASE_URL} https://challenges.cloudflare.com${isDev ? " ws:" : ""}`,
  `frame-src https://challenges.cloudflare.com ${SUPABASE_URL}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // El dev server de Next.js bloquea en silencio los assets (incluido el script de
  // Turnstile) cuando se accede por un hostname que no sea localhost. Necesario
  // para probar desde el celular por wifi vía la IP de LAN del Mac.
  allowedDevOrigins: isDev ? ["undefined"] : undefined,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: "/backend-health",
        destination: `${API_URL}/health`,
      },
    ];
  },
};

export default nextConfig;
