import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es requerido"),
  SUPABASE_URL: z.string().min(1, "SUPABASE_URL es requerido"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY es requerido"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY es requerido"),
  SMTP_HOST: z.string().min(1, "SMTP_HOST es requerido"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1, "SMTP_USER es requerido"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS es requerido"),
  SMTP_FROM: z.string().email(),
  SMTP_FROM_NAME: z.string().default("Posesión Docente - SED Magdalena"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Configuración de entorno inválida");
}

export const env = parsed.data;
