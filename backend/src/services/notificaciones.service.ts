import type { TipoNotificacion } from "@prisma/client";
import { emailLayout } from "@/lib/emailTemplate";
import { FROM_EMAIL, LOGO_ATTACHMENT, transporter } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

interface NotificarParams {
  usuarioId: string;
  tipo: TipoNotificacion;
  mensaje: string;
  email?: {
    asunto: string;
    badgeTexto: string;
    badgeTono: "info" | "exito" | "peligro";
    encabezado: string;
    parrafos: string[];
    destacado?: string;
    ctaTexto: string;
    ctaUrl: string;
  };
}

/**
 * Crea la notificación in-app y, si se provee `email`, envía además el correo
 * transaccional (plantilla de marca propia, ver `lib/emailTemplate.ts`) vía SMTP
 * del buzón propio del dominio — no una plataforma externa, no el SMTP
 * institucional .gov.co. Sea cual sea el resultado, queda una fila canal=EMAIL
 * con el HTML exacto enviado y si el servidor SMTP lo aceptó o no — historial
 * interno propio, sin depender del dashboard de un tercero.
 *
 * A diferencia del SDK de Resend (que usábamos antes y no lanzaba excepción en
 * error), Nodemailer sí lanza si el SMTP rechaza el envío — por eso el try/catch:
 * un fallo de correo nunca debe tumbar la operación que lo disparó (registro,
 * validación de documento, etc.).
 */
export const notificar = async ({ usuarioId, tipo, mensaje, email }: NotificarParams) => {
  await prisma.notificacion.create({
    data: { usuarioId, tipo, mensaje, canal: "IN_APP" },
  });

  if (!email) return;

  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
  const html = emailLayout(email);

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: usuario.email,
      subject: email.asunto,
      html,
      attachments: [LOGO_ATTACHMENT],
    });
    await prisma.notificacion.create({
      data: {
        usuarioId,
        tipo,
        mensaje,
        canal: "EMAIL",
        emailAsunto: email.asunto,
        emailHtml: html,
        emailEstado: "ENVIADO",
      },
    });
  } catch (err) {
    console.error(`Error enviando correo a ${usuario.email}:`, err);
    await prisma.notificacion.create({
      data: {
        usuarioId,
        tipo,
        mensaje,
        canal: "EMAIL",
        emailAsunto: email.asunto,
        emailHtml: html,
        emailEstado: "FALLIDO",
        emailError: err instanceof Error ? err.message : String(err),
      },
    });
  }
};
