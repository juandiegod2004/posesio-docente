import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "@/lib/AppError";
import { URL_LOGIN } from "@/lib/emailTemplate";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { cedulaSchema, nombreSchema, passwordSchema, telefonoSchema } from "@/lib/validaciones";
import { notificar } from "@/services/notificaciones.service";

const registroSchema = z.object({
  cedula: cedulaSchema,
  tipoDocumento: z.enum(["CEDULA_CIUDADANIA", "CEDULA_EXTRANJERIA", "TARJETA_IDENTIDAD", "PASAPORTE", "PEP", "PPT"]),
  nombres: nombreSchema,
  apellidos: nombreSchema,
  email: z.string().email(),
  password: passwordSchema,
  telefono: telefonoSchema,
  tipoPosesion: z.enum(["DOCENTE", "ADMINISTRATIVO"]).optional(),
});

/**
 * Registro de un docente. El docente ya debió confirmar el correo institucional
 * (paso previo, fuera de este endpoint) antes de llegar aquí. El registro queda
 * "incompleto" (Docente.registroCompletado = false) hasta que suba el documento
 * de autorización de notificación electrónica vía POST /api/documentos.
 */
// 2026-10-06: registros cerrados por decisión institucional — ya se registró
// quien debía registrarse, ahora solo inician sesión para hacer correcciones.
// Flag único para reabrir si se decide lo contrario más adelante.
const REGISTRO_CERRADO = true;

export const registrar = async (req: Request, res: Response) => {
  if (REGISTRO_CERRADO) {
    throw new AppError(
      403,
      "El registro de nuevos docentes está cerrado. Si ya tienes una cuenta, inicia sesión para completar tus correcciones y gestión documental. Para más información, comunícate con la Secretaría de Educación del Magdalena.",
    );
  }

  const datos = registroSchema.parse(req.body);

  const existente = await prisma.usuario.findUnique({ where: { cedula: datos.cedula } });
  if (existente) {
    throw new AppError(409, "Ya existe un registro con esta cédula");
  }

  // Lista negra (2026-10-02, ver cedulasBloqueadas.controller.ts): cédulas a las
  // que un Super Usuario le negó el registro (ej. reporte de título académico
  // falso) — mensaje genérico a propósito, no se le expone el motivo real al
  // candidato, eso solo lo ven roles internos vía GET /api/cedulas-bloqueadas.
  const bloqueada = await prisma.cedulaBloqueada.findUnique({ where: { cedula: datos.cedula } });
  if (bloqueada) {
    throw new AppError(403, "No es posible completar tu registro. Comunícate con la Secretaría de Educación del Magdalena para más información.");
  }

  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email: datos.email,
    password: datos.password,
    email_confirm: true,
  });

  if (error || !authUser.user) {
    throw new AppError(400, `No se pudo crear el usuario: ${error?.message ?? "error desconocido"}`);
  }

  try {
    const usuario = await prisma.usuario.create({
      data: {
        id: authUser.user.id,
        cedula: datos.cedula,
        tipoDocumento: datos.tipoDocumento,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        email: datos.email,
        telefono: datos.telefono,
        rol: "DOCENTE",
        docente: { create: { tipoPosesion: datos.tipoPosesion ?? "DOCENTE" } },
      },
      include: { docente: true },
    });

    const mensajeDocente = "Tu registro fue exitoso. Debes subir la autorización de notificación electrónica para completarlo.";
    await notificar({
      usuarioId: usuario.id,
      tipo: "REGISTRO",
      mensaje: mensajeDocente,
      email: {
        asunto: "Registro exitoso — Posesión Docente SED Magdalena",
        badgeTexto: "Registro exitoso",
        badgeTono: "info",
        encabezado: `¡Bienvenido/a, ${datos.nombres}!`,
        parrafos: [
          "Tu registro en la plataforma de Posesión Docente fue exitoso.",
          "Para completarlo, inicia sesión y sube la <strong>autorización de notificación electrónica</strong> — es el único paso que falta para habilitar tu checklist completo.",
        ],
        ctaTexto: "Iniciar sesión",
        ctaUrl: URL_LOGIN,
      },
    });

    // Un registro nuevo solo le compete a SAC (son quienes van a revisar la
    // autorización de notificación electrónica que el docente subirá a continuación)
    // + SUPER_USUARIO. TALENTO_HUMANO no tiene nada que hacer con un docente que
    // todavía ni siquiera pasó la validación de SAC, así que no se le notifica.
    // GESTOR_DOCUMENTAL tampoco: su acceso está limitado a docentes con
    // documentacionAprobada=true (ver docentes.controller.ts).
    const revisores = await prisma.usuario.findMany({
      where: { rol: { in: ["SAC", "SUPER_USUARIO"] }, activo: true },
      select: { id: true },
    });
    const mensajeStaff = `${datos.nombres} ${datos.apellidos} (cédula ${datos.cedula}) se registró en el sistema.`;
    await Promise.all(
      revisores.map((revisor) =>
        notificar({
          usuarioId: revisor.id,
          tipo: "REGISTRO",
          mensaje: mensajeStaff,
          email: {
            asunto: "Nuevo registro de docente",
            badgeTexto: "Nuevo registro",
            badgeTono: "info",
            encabezado: "Nuevo registro en el sistema",
            parrafos: [mensajeStaff],
            ctaTexto: "Ver en la plataforma",
            ctaUrl: URL_LOGIN,
          },
        }),
      ),
    );

    res.status(201).json({ usuario });
  } catch (err) {
    // Si falla la creación en BD, no dejar huérfano el usuario de Supabase Auth.
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw err;
  }
};

export const obtenerPerfil = async (req: Request, res: Response) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario!.id },
    include: {
      docente: {
        include: {
          documentos: {
            where: { tipoDocumento: { esRequisitoRegistro: true } },
          },
        },
      },
    },
  });

  if (!usuario) throw new AppError(404, "Usuario no encontrado");

  const { docente, ...resto } = usuario;

  if (!docente) {
    res.json({ ...resto, docente: null });
    return;
  }

  const { documentos, ...datosDocente } = docente;
  const [documentoAutorizacion] = documentos;

  // Se necesita el tipoDocumentoId de AUTORIZACION_NOTIFICACION_ELECTRONICA incluso
  // cuando el docente todavía no ha subido nada (documentos sale vacío en ese caso,
  // ya que ese array sale de una relación con Documento, no de TipoDocumento).
  const tipoAutorizacion = await prisma.tipoDocumento.findFirst({
    where: { esRequisitoRegistro: true },
    select: { id: true },
  });

  res.json({
    ...resto,
    docente: {
      ...datosDocente,
      tipoDocumentoAutorizacionId: tipoAutorizacion?.id ?? null,
      // Único documento con esRequisitoRegistro=true (AUTORIZACION_NOTIFICACION_ELECTRONICA).
      // Si el validador lo rechaza después del registro, el frontend debe bloquear
      // al docente con un modal obligatorio hasta que lo vuelva a subir corregido.
      documentoAutorizacionRechazado:
        documentoAutorizacion?.estado === "RECHAZADO"
          ? {
              documentoId: documentoAutorizacion.id,
              tipoDocumentoId: documentoAutorizacion.tipoDocumentoId,
              comentario: documentoAutorizacion.comentarioValidador,
              actualizadoEn: documentoAutorizacion.actualizadoEn,
            }
          : null,
      // Ya no se autoaprueba al subir: un validador debe aprobarla para que
      // registroCompletado pase a true. Mientras tanto, el frontend debe bloquear
      // con un mensaje de "pendiente de revisión" (distinto del de "nunca subiste
      // nada" y del de "te la rechazaron", que ya vienen de los dos campos de arriba).
      documentoAutorizacionPendiente: documentoAutorizacion?.estado === "EN_REVISION",
    },
  });
};

const cambiarPasswordSchema = z.object({
  passwordNueva: passwordSchema,
});

/**
 * El propio usuario autenticado cambia su contraseña (reemplaza el flujo de
 * "olvidé mi contraseña" por correo, que se eliminó a propósito). Sirve tanto
 * para el cambio obligatorio tras un restablecimiento por un Super Usuario
 * (ver PATCH /api/usuarios/:id/clave) como para un cambio voluntario cualquiera.
 */
export const cambiarPassword = async (req: Request, res: Response) => {
  const { passwordNueva } = cambiarPasswordSchema.parse(req.body);

  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.usuario!.id, { password: passwordNueva });
  if (error) {
    throw new AppError(400, `No se pudo cambiar la clave: ${error.message}`);
  }

  const usuario = await prisma.usuario.update({
    where: { id: req.usuario!.id },
    data: { debeCambiarPassword: false },
  });

  res.json(usuario);
};
