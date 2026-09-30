import { env } from "@/config/env";

/** Identificador del logo embebido como adjunto inline (ver `mailer.ts`). */
export const LOGO_CID = "logo-sed";

type BadgeTono = "info" | "exito" | "peligro";

const TONOS: Record<BadgeTono, { fondo: string; texto: string }> = {
  info: { fondo: "#E6F0FA", texto: "#0071BB" },
  exito: { fondo: "#E7F4E4", texto: "#4d9142" },
  peligro: { fondo: "#FCE7EB", texto: "#d61b46" },
};

interface EmailLayoutParams {
  badgeTexto: string;
  badgeTono: BadgeTono;
  encabezado: string;
  /** Párrafos ya en HTML (pueden traer <strong>, etc.), se renderizan en orden. */
  parrafos: string[];
  /** Recuadro destacado opcional (ej. comentario del validador al rechazar). */
  destacado?: string;
  ctaTexto: string;
  ctaUrl: string;
}

/**
 * Plantilla base de correo, compartida por los 4 tipos de notificación
 * (registro, documento aprobado/rechazado, proceso completo). Colores y franja
 * cromática tomados del Manual de Identidad Visual de la Gobernación del
 * Magdalena — aprobada visualmente con el usuario antes de implementarse.
 */
export const emailLayout = ({ badgeTexto, badgeTono, encabezado, parrafos, destacado, ctaTexto, ctaUrl }: EmailLayoutParams): string => {
  const tono = TONOS[badgeTono];
  const franja = ["#EF7D00", "#A28034", "#FEC800", "#F7003C", "#0071BB", "#00B7D9", "#9FD7E5", "#69B75E", "#EF7D00"]
    .map((color) => `<td style="background:${color};height:6px;line-height:6px;font-size:0;">&nbsp;</td>`)
    .join("");

  const parrafosHtml = parrafos
    .map((p) => `<p style="margin:0 0 14px;font:15px/1.65 Arial,sans-serif;color:#55565a;">${p}</p>`)
    .join("");

  const destacadoHtml = destacado
    ? `<div style="background:#FCE7EB;color:#8a1230;border-radius:8px;padding:14px 16px;margin:0 0 18px;font:14px/1.6 Arial,sans-serif;">${destacado}</div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#dfe1e4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#dfe1e4;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:22px 28px 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                  <td style="padding-right:12px;"><img src="cid:${LOGO_CID}" width="46" height="46" alt="Secretaría de Educación del Magdalena" style="display:block;"></td>
                  <td style="font:700 13px/1.3 Arial,sans-serif;color:#3a3a3c;">
                    Secretaría de Educación
                    <div style="font:400 11px/1.3 Arial,sans-serif;color:#8a8a8e;margin-top:1px;">Proceso de Posesión Docente — SED Magdalena</div>
                  </td>
                </tr></table>
              </td>
            </tr>
            <tr><td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${franja}</tr></table>
            </td></tr>
            <tr><td style="padding:30px 28px 6px;">
              <span style="display:inline-block;font:700 11px/1 Arial,sans-serif;letter-spacing:.4px;text-transform:uppercase;padding:6px 11px;border-radius:20px;margin-bottom:16px;background:${tono.fondo};color:${tono.texto};">${badgeTexto}</span>
              <h2 style="margin:0 0 12px;font:700 19px/1.35 Arial,sans-serif;color:#2c2c2e;">${encabezado}</h2>
              ${parrafosHtml}
              ${destacadoHtml}
              <a href="${ctaUrl}" style="display:inline-block;background:#EF7D00;color:#ffffff;font:700 14px/1 Arial,sans-serif;padding:14px 26px;border-radius:7px;text-decoration:none;margin:6px 0 30px;">${ctaTexto}</a>
            </td></tr>
            <tr><td style="padding:20px 28px 26px;border-top:1px solid #eee;">
              <p style="margin:0 0 5px;font:11.5px/1.6 Arial,sans-serif;color:#9a9a9e;">Este es un mensaje automático del sistema de Posesión Docente — por favor no respondas a este correo.</p>
              <p style="margin:0;font:11.5px/1.6 Arial,sans-serif;color:#9a9a9e;">¿Necesitas ayuda? Escríbenos a <a href="mailto:mcantillo@sedmagdalena.gov.co" style="color:#0071BB;text-decoration:none;">mcantillo@sedmagdalena.gov.co</a></p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

/** URL a la que apuntan todos los CTA — nunca a una pantalla específica: el correo no lleva sesión, así que siempre se manda a iniciar sesión. */
export const URL_LOGIN = `${env.CORS_ORIGIN}/login`;
