import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "@/lib/AppError";
import { URL_LOGIN } from "@/lib/emailTemplate";
import { eliminarArchivoDocumento, obtenerUrlFirmada, subirArchivoDocumento } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { notificar } from "@/services/notificaciones.service";

const subirDocumentoSchema = z.object({
  docenteId: z.string().uuid(),
  tipoDocumentoId: z.string().uuid(),
});

const listarDocumentosQuerySchema = z.object({
  estado: z.enum(["PENDIENTE", "EN_REVISION", "APROBADO", "RECHAZADO", "ARCHIVO_ELIMINADO"]).optional(),
  q: z.string().trim().min(1).optional(),
});

/**
 * Bandeja de validación: lista plana de documentos de TODOS los docentes
 * (no de uno solo, a diferencia de /api/docentes/:id/checklist), con
 * búsqueda por nombre/cédula del docente o nombre del tipo de documento, y
 * filtro por estado. Para SAC/TALENTO_HUMANO/SUPER_USUARIO sin restricción;
 * GESTOR_DOCUMENTAL solo ve documentos de docentes con documentacionAprobada=true
 * (ver nota de rol en docentes.controller.ts).
 */
export const listarDocumentos = async (req: Request, res: Response) => {
  const { estado, q } = listarDocumentosQuerySchema.parse(req.query);
  const esGestorDocumental = req.usuario?.rol === "GESTOR_DOCUMENTAL";

  const documentos = await prisma.documento.findMany({
    where: {
      estado,
      ...(esGestorDocumental && { docente: { documentacionAprobada: true } }),
      ...(q && {
        OR: [
          { docente: { usuario: { nombres: { contains: q, mode: "insensitive" } } } },
          { docente: { usuario: { apellidos: { contains: q, mode: "insensitive" } } } },
          { docente: { usuario: { cedula: { contains: q } } } },
          { tipoDocumento: { nombre: { contains: q, mode: "insensitive" } } },
        ],
      }),
    },
    include: {
      docente: { include: { usuario: { select: { id: true, cedula: true, nombres: true, apellidos: true } } } },
      tipoDocumento: { select: { id: true, codigo: true, nombre: true, orden: true } },
      validaciones: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { validador: { select: { nombres: true, apellidos: true } } },
      },
    },
    orderBy: { subidoEn: "desc" },
  });

  res.json(
    documentos.map((doc) => {
      const ultimaValidacion = doc.validaciones[0];
      return {
        id: doc.id,
        estado: doc.estado,
        archivoNombre: doc.archivoNombre,
        comentarioValidador: doc.comentarioValidador,
        subidoEn: doc.subidoEn,
        validadoPor: ultimaValidacion ? { nombres: ultimaValidacion.validador.nombres, apellidos: ultimaValidacion.validador.apellidos } : null,
        validadoEn: ultimaValidacion?.createdAt ?? null,
        docente: {
          id: doc.docente.id,
          cedula: doc.docente.usuario.cedula,
          nombres: doc.docente.usuario.nombres,
          apellidos: doc.docente.usuario.apellidos,
        },
        tipoDocumento: doc.tipoDocumento,
      };
    }),
  );
};

/** El docente sube (o vuelve a subir tras un rechazo) un documento del checklist. */
export const subirDocumento = async (req: Request, res: Response) => {
  const { docenteId, tipoDocumentoId } = subirDocumentoSchema.parse(req.body);

  if (!req.file) {
    throw new AppError(400, "Debes adjuntar un archivo");
  }

  // El fileFilter de multer solo valida el mimetype declarado por el cliente (falsificable).
  // Aquí se valida la firma real del archivo (los PDF siempre empiezan con "%PDF-").
  if (!req.file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new AppError(400, "El archivo no es un PDF válido");
  }

  const docente = await prisma.docente.findUnique({
    where: { id: docenteId },
    include: { usuario: { select: { nombres: true, apellidos: true, cedula: true } } },
  });
  if (!docente) throw new AppError(404, "Docente no encontrado");

  if (req.usuario?.id !== docente.usuarioId) {
    throw new AppError(403, "Solo el propio docente puede subir sus documentos");
  }

  // Módulo de carga de documentos bloqueado hasta completar la información
  // adicional (fecha/lugar de nacimiento, expedición de cédula, etc.) — aplica a
  // CUALQUIER documento, incluida la autorización de notificación electrónica.
  // Los docentes que ya existían antes de este requisito quedan eximidos
  // (debeCompletarInformacionAdicional=false, ver migración informacion_adicional_docente).
  if (docente.debeCompletarInformacionAdicional && !docente.informacionAdicionalCompleta) {
    throw new AppError(403, "Debes completar tu información adicional antes de subir documentos.");
  }

  const tipoDocumento = await prisma.tipoDocumento.findUnique({ where: { id: tipoDocumentoId } });
  if (!tipoDocumento) throw new AppError(404, "Tipo de documento no encontrado");

  // La autorización de notificación electrónica desbloquea el resto del checklist
  // apenas se sube (ver más abajo) — no espera aprobación de un validador. Si este
  // chequeo dispara es porque nunca se subió, o porque se subió y luego un validador
  // la rechazó (lo que resetea registroCompletado a false, ver validarDocumento).
  if (!tipoDocumento.esRequisitoRegistro && !docente.registroCompletado) {
    const autorizacion = await prisma.documento.findFirst({
      where: { docenteId, tipoDocumento: { esRequisitoRegistro: true } },
      select: { estado: true },
    });
    if (autorizacion?.estado === "RECHAZADO") {
      throw new AppError(403, "Tu autorización de notificación electrónica fue rechazada. Corrígela antes de continuar.");
    }
    throw new AppError(403, "Debes subir primero la autorización de notificación electrónica.");
  }

  const documentoExistente = await prisma.documento.findUnique({
    where: { docenteId_tipoDocumentoId: { docenteId, tipoDocumentoId } },
  });

  const archivoPath = await subirArchivoDocumento(docenteId, tipoDocumento.codigo, req.file);

  const documento = await prisma.documento.upsert({
    where: { docenteId_tipoDocumentoId: { docenteId, tipoDocumentoId } },
    create: {
      docenteId,
      tipoDocumentoId,
      archivoPath,
      archivoNombre: req.file.originalname,
      estado: "EN_REVISION",
    },
    update: {
      archivoPath,
      archivoNombre: req.file.originalname,
      estado: "EN_REVISION",
      comentarioValidador: null,
    },
  });

  // Se borra después de confirmar el upsert: si algo falla antes, no se pierde el archivo anterior.
  if (documentoExistente) {
    await eliminarArchivoDocumento(documentoExistente.archivoPath);
  }

  // La autorización de notificación electrónica desbloquea el resto del checklist
  // apenas se sube — no espera a que un validador la apruebe (a diferencia del resto
  // de documentos, que sí requieren aprobación explícita para cada uno). Si luego SAC
  // la rechaza, registroCompletado vuelve a false y el docente se bloquea de nuevo
  // (ver validarDocumento); al volver a subirla corregida, se desbloquea otra vez acá.
  if (tipoDocumento.esRequisitoRegistro) {
    await prisma.docente.update({ where: { id: docenteId }, data: { registroCompletado: true } });

    // Aprobar/rechazar esta autorización sigue siendo competencia exclusiva de SAC
    // (+ SUPER_USUARIO) — se les avisa para que la revisen, aunque ya no bloquea al
    // docente mientras tanto. TALENTO_HUMANO no valida este documento (ver
    // validarDocumento) y GESTOR_DOCUMENTAL no participa de la revisión de
    // documentos pendientes (ver nota de rol en docentes.controller.ts).
    const revisores = await prisma.usuario.findMany({
      where: { rol: { in: ["SAC", "SUPER_USUARIO"] }, activo: true },
      select: { id: true },
    });
    const mensaje = `${docente.usuario.nombres} ${docente.usuario.apellidos} (cédula ${docente.usuario.cedula}) subió su autorización de notificación electrónica — pendiente de revisión.`;
    await Promise.all(
      revisores.map((revisor) =>
        notificar({
          usuarioId: revisor.id,
          tipo: "DOCUMENTO_EN_REVISION",
          mensaje,
          email: {
            asunto: "Autorización de notificación electrónica pendiente de revisión",
            badgeTexto: "Pendiente de revisión",
            badgeTono: "info",
            encabezado: "Autorización pendiente de revisión",
            parrafos: [mensaje],
            ctaTexto: "Ir a la bandeja de validación",
            ctaUrl: URL_LOGIN,
          },
        }),
      ),
    );
  }

  res.status(201).json(documento);
};

/** Devuelve una URL firmada temporal para visualizar el archivo de un documento. */
export const obtenerUrlDocumento = async (req: Request, res: Response) => {
  const { id } = req.params;

  const documento = await prisma.documento.findUnique({
    include: { docente: true },
    where: { id },
  });
  if (!documento) throw new AppError(404, "Documento no encontrado");

  const esPropio = req.usuario?.id === documento.docente.usuarioId;
  const esRevisorCompleto = req.usuario && ["SAC", "TALENTO_HUMANO", "SUPER_USUARIO"].includes(req.usuario.rol);
  // GESTOR_DOCUMENTAL solo accede a documentos de docentes con TODA su
  // documentación aprobada (ver nota de rol en docentes.controller.ts).
  const esGestorDocumentalConAcceso = req.usuario?.rol === "GESTOR_DOCUMENTAL" && documento.docente.documentacionAprobada;
  if (!esPropio && !esRevisorCompleto && !esGestorDocumentalConAcceso) {
    throw new AppError(403, "No tienes acceso a este documento");
  }

  if (documento.estado === "ARCHIVO_ELIMINADO") {
    throw new AppError(410, "El archivo fue eliminado del almacenamiento y ya no está disponible. Debe volver a subirse.");
  }

  const url = await obtenerUrlFirmada(documento.archivoPath);
  res.json({ url });
};

const validarDocumentoSchema = z.object({
  estado: z.enum(["APROBADO", "RECHAZADO"]),
  comentario: z.string().optional(),
});

/**
 * SAC y Talento Humano aprueban/rechazan documentos, cada uno en su carril:
 * SAC solo la autorización de notificación electrónica (esRequisitoRegistro=true)
 * — es lo que habilita al docente a subir el resto —, Talento Humano solo el resto
 * del checklist. SUPER_USUARIO no tiene esta restricción (control total). Deja
 * trazabilidad en Validacion sin importar quién validó.
 */
export const validarDocumento = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado, comentario } = validarDocumentoSchema.parse(req.body);

  if (estado === "RECHAZADO" && !comentario) {
    throw new AppError(400, "Debes indicar un comentario al rechazar un documento");
  }

  const documento = await prisma.documento.findUnique({
    where: { id },
    include: { docente: { include: { usuario: true } }, tipoDocumento: true },
  });
  if (!documento) throw new AppError(404, "Documento no encontrado");

  const rol = req.usuario!.rol;
  if (rol === "SAC" && !documento.tipoDocumento.esRequisitoRegistro) {
    throw new AppError(403, "SAC solo puede validar la autorización de notificación electrónica — el resto del checklist es competencia de Talento Humano");
  }
  if (rol === "TALENTO_HUMANO" && documento.tipoDocumento.esRequisitoRegistro) {
    throw new AppError(403, "Talento Humano no valida la autorización de notificación electrónica — eso es competencia exclusiva de SAC");
  }

  const validadorId = req.usuario!.id;

  // updateMany condicionado al estado leído: si otro validador ya actuó sobre este documento
  // (o su archivo fue eliminado) entre el findUnique de arriba y este punto, count() da 0 y
  // se aborta la transacción en vez de sobreescribir en silencio.
  const documentoActualizado = await prisma.$transaction(async (tx) => {
    const resultado = await tx.documento.updateMany({
      where: { id, estado: { in: ["PENDIENTE", "EN_REVISION"] } },
      data: { estado, comentarioValidador: comentario ?? null },
    });

    if (resultado.count === 0) {
      throw new AppError(409, "Este documento ya fue actualizado por otra acción. Recarga la bandeja para ver el estado actual.");
    }

    await tx.validacion.create({
      data: { documentoId: id, validadorId, estadoResultante: estado, comentario },
    });

    return tx.documento.findUniqueOrThrow({ where: { id } });
  });

  // Un rechazo de la autorización de notificación electrónica vuelve a bloquear al
  // docente (registroCompletado a false) hasta que la resuba corregida — se
  // desbloquea otra vez en subirDocumento, sin esperar nueva aprobación. La
  // aprobación de este documento ya no necesita tocar registroCompletado: quedó en
  // true desde que se subió (ver subirDocumento).
  const esAutorizacionRechazada = estado === "RECHAZADO" && documento.tipoDocumento.esRequisitoRegistro;
  if (esAutorizacionRechazada) {
    await prisma.docente.update({ where: { id: documento.docenteId }, data: { registroCompletado: false } });
  }

  await notificar({
    usuarioId: documento.docente.usuario.id,
    tipo: estado === "APROBADO" ? "DOCUMENTO_APROBADO" : "DOCUMENTO_RECHAZADO",
    mensaje: esAutorizacionRechazada
      ? `Tu autorización de notificación electrónica fue rechazada: ${comentario}. Debes corregirla y volver a subirla para continuar con el resto de tu documentación.`
      : estado === "APROBADO"
        ? `Tu documento "${documento.tipoDocumento.nombre}" fue aprobado.`
        : `Tu documento "${documento.tipoDocumento.nombre}" fue rechazado: ${comentario}`,
    email: {
      asunto: estado === "APROBADO" ? `Documento aprobado: ${documento.tipoDocumento.nombre}` : `Actualización de tu documento: ${documento.tipoDocumento.nombre}`,
      badgeTexto: estado === "APROBADO" ? "Documento aprobado" : "Documento rechazado",
      badgeTono: estado === "APROBADO" ? "exito" : "peligro",
      encabezado: `Hola ${documento.docente.usuario.nombres},`,
      parrafos: estado === "APROBADO"
        ? [`Tu documento <strong>${documento.tipoDocumento.nombre}</strong> fue <strong style="color:#4d9142">aprobado</strong>.`]
        : esAutorizacionRechazada
          ? [
              'Tu <strong>autorización de notificación electrónica</strong> fue <strong style="color:#d61b46">rechazada</strong>.',
              "Debes corregirla y volver a subirla antes de continuar con el resto de tu documentación.",
            ]
          : [
              `Tu documento <strong>${documento.tipoDocumento.nombre}</strong> fue <strong style="color:#d61b46">rechazado</strong>. Revisa el comentario y vuelve a subirlo corregido.`,
            ],
      destacado: estado === "RECHAZADO" ? `"${comentario}"` : undefined,
      ctaTexto: estado === "APROBADO" ? "Ver mi checklist" : "Corregir y volver a subir",
      ctaUrl: URL_LOGIN,
    },
  });

  // Un rechazo invalida el "ya subí todo, está listo para revisión" que el docente
  // ya había marcado — hay que corregir este documento antes de poder re-notificar
  // al personal revisor. Sin este reset, PATCH /:id/finalizar quedaría inalcanzable
  // para siempre tras el primer rechazo (ver `finalizarDocumentacion`).
  if (estado === "RECHAZADO" && documento.docente.documentacionFinalizada) {
    await prisma.docente.update({
      where: { id: documento.docenteId },
      data: { documentacionFinalizada: false, documentacionFinalizadaEn: null },
    });
  }

  // Si este fue el último documento en quedar APROBADO, el proceso de posesión del
  // docente está completo. `documentacionAprobada` evita reenviar el correo si un
  // documento se rechaza y se vuelve a aprobar más adelante.
  if (estado === "APROBADO" && !documento.docente.documentacionAprobada) {
    const [totalTipos, aprobados] = await Promise.all([
      prisma.tipoDocumento.count(),
      prisma.documento.count({ where: { docenteId: documento.docenteId, estado: "APROBADO" } }),
    ]);

    if (aprobados === totalTipos) {
      await prisma.docente.update({
        where: { id: documento.docenteId },
        data: { documentacionAprobada: true, documentacionAprobadaEn: new Date() },
      });

      const mensaje = "¡Tu proceso de posesión fue aprobado en su totalidad! Todos tus documentos fueron validados.";
      await notificar({
        usuarioId: documento.docente.usuario.id,
        tipo: "DOCUMENTACION_APROBADA",
        mensaje,
        email: {
          asunto: "Proceso de posesión completado",
          badgeTexto: "Documentación aprobada",
          badgeTono: "exito",
          encabezado: `¡Felicitaciones, ${documento.docente.usuario.nombres}!`,
          parrafos: [
            `Tus ${totalTipos} documentos fueron revisados y <strong style="color:#4d9142">aprobados en su totalidad</strong>. Tu proceso de posesión docente quedó completo.`,
          ],
          ctaTexto: "Ver mi checklist",
          ctaUrl: URL_LOGIN,
        },
      });
    }
  }

  res.json(documentoActualizado);
};
