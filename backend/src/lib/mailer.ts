import path from "node:path";
import nodemailer from "nodemailer";
import { env } from "@/config/env";
import { LOGO_CID } from "@/lib/emailTemplate";

/**
 * SMTP del buzón propio del dominio (ej. IONOS) — sin plataforma de correo externa.
 * Timeouts explícitos: sin esto, un SMTP mal configurado o inalcanzable puede colgar
 * la conexión por minutos, y `notificar()` se llama dentro de requests normales
 * (registro, validación de documentos) — un correo lento no debe demorar esas respuestas.
 */
export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

export const FROM_EMAIL = { name: env.SMTP_FROM_NAME, address: env.SMTP_FROM };

/**
 * Adjunto inline del logo (referenciado como `cid:logo-sed` en emailTemplate.ts).
 * Se usa CID en vez de una URL pública o un data: URI porque es lo que mejor
 * soportan los clientes de correo (Outlook en particular no renderiza bien
 * imágenes base64 embebidas, y todavía no hay un dominio público sirviendo el backend).
 * Ruta relativa al cwd del proceso (no a __dirname): `src/` sigue existiendo en disco
 * tanto en dev (tsx) como en producción (tras `tsc build`, que solo agrega `dist/`).
 */
export const LOGO_ATTACHMENT = {
  filename: "logo-sed.png",
  path: path.join(process.cwd(), "src/assets/logo-sed.png"),
  cid: LOGO_CID,
};
