import { ZipArchive } from "archiver";
import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "@/lib/AppError";
import { URL_LOGIN } from "@/lib/emailTemplate";
import { descargarArchivoDocumento } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { notificar } from "@/services/notificaciones.service";

/**
 * Lista docentes con su avance de checklist (para SAC/TALENTO_HUMANO/SUPER_USUARIO,
 * sin restricción). GESTOR_DOCUMENTAL solo ve los docentes con TODA su
 * documentación aprobada (documentacionAprobada=true) — mientras un docente esté
 * en proceso, este rol no tiene ninguna visibilidad sobre él (ver también
 * obtenerChecklist, obtenerPerfilDocente y descargarDocumentos, que aplican la
 * misma regla para el detalle de un docente puntual).
 */
export const listarDocentes = async (req: Request, res: Response) => {
  const esGestorDocumental = req.usuario?.rol === "GESTOR_DOCUMENTAL";

  const docentes = await prisma.docente.findMany({
    where: esGestorDocumental ? { documentacionAprobada: true } : undefined,
    include: {
      usuario: { select: { id: true, cedula: true, nombres: true, apellidos: true, email: true, telefono: true, activo: true, debeCambiarPassword: true } },
      documentos: { select: { estado: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const resultado = docentes.map((docente) => {
    const total = docente.documentos.length;
    const aprobados = docente.documentos.filter((d) => d.estado === "APROBADO").length;
    const rechazados = docente.documentos.filter((d) => d.estado === "RECHAZADO").length;

    return {
      id: docente.id,
      usuario: docente.usuario,
      registroCompletado: docente.registroCompletado,
      tipoPosesion: docente.tipoPosesion,
      documentacionFinalizada: docente.documentacionFinalizada,
      documentacionFinalizadaEn: docente.documentacionFinalizadaEn,
      documentacionAprobada: docente.documentacionAprobada,
      documentacionAprobadaEn: docente.documentacionAprobadaEn,
      debeCompletarInformacionAdicional: docente.debeCompletarInformacionAdicional,
      informacionAdicionalCompleta: docente.informacionAdicionalCompleta,
      documentosSubidos: total,
      documentosAprobados: aprobados,
      documentosRechazados: rechazados,
    };
  });

  res.json(resultado);
};

/**
 * Checklist completo de un docente: todos los tipos de documento del catálogo (el
 * checklist normal + el de autorización de notificación electrónica) con el estado
 * de cada uno. Este último ya no se sube durante el registro (el frontend dejó de auto-loguear tras
 * registrarse), así que tiene que poder subirse desde aquí como cualquier otro.
 */
export const obtenerChecklist = async (req: Request, res: Response) => {
  const { id } = req.params;

  const docente = await prisma.docente.findUnique({ where: { id } });
  if (!docente) {
    throw new AppError(404, "Docente no encontrado");
  }

  const esPropio = req.usuario?.id === docente.usuarioId;
  const esRevisorCompleto = req.usuario && ["SAC", "TALENTO_HUMANO", "SUPER_USUARIO"].includes(req.usuario.rol);
  const esGestorDocumentalConAcceso = req.usuario?.rol === "GESTOR_DOCUMENTAL" && docente.documentacionAprobada;
  if (!esPropio && !esRevisorCompleto && !esGestorDocumentalConAcceso) {
    throw new AppError(403, "No tienes acceso a este docente");
  }

  const [tipos, documentos] = await Promise.all([
    prisma.tipoDocumento.findMany({ orderBy: { orden: "asc" } }),
    prisma.documento.findMany({
      where: { docenteId: id },
      include: {
        validaciones: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { validador: { select: { nombres: true, apellidos: true } } },
        },
      },
    }),
  ]);

  const documentosPorTipo = new Map(documentos.map((doc) => [doc.tipoDocumentoId, doc]));

  const checklist = tipos.map((tipo) => {
    const documento = documentosPorTipo.get(tipo.id);
    const ultimaValidacion = documento?.validaciones[0];
    return {
      tipoDocumentoId: tipo.id,
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      obligatorio: tipo.obligatorio,
      documento: documento
        ? {
            id: documento.id,
            estado: documento.estado,
            archivoNombre: documento.archivoNombre,
            comentarioValidador: documento.comentarioValidador,
            subidoEn: documento.subidoEn,
            validadoPor: ultimaValidacion ? { nombres: ultimaValidacion.validador.nombres, apellidos: ultimaValidacion.validador.apellidos } : null,
            validadoEn: ultimaValidacion?.createdAt ?? null,
          }
        : null,
    };
  });

  res.json({ docenteId: id, checklist });
};

/**
 * Perfil completo de un docente: todos los datos que llenó al registrarse y en el
 * formulario de información adicional (documento de identidad, dirección, fecha y
 * lugar de nacimiento, cantidad de hijos, expedición de cédula, estado civil, tipo
 * de sangre, etc.). No incluye el checklist de documentos — eso vive en
 * GET /:id/checklist. Mismo control de acceso que el resto de endpoints de detalle
 * de un docente (ver nota de rol al inicio del archivo).
 */
export const obtenerPerfilDocente = async (req: Request, res: Response) => {
  const { id } = req.params;

  const docente = await prisma.docente.findUnique({
    where: { id },
    include: {
      usuario: {
        select: { id: true, cedula: true, tipoDocumento: true, nombres: true, apellidos: true, email: true, telefono: true },
      },
      departamentoNacimiento: { select: { id: true, nombre: true } },
      ciudadNacimiento: { select: { id: true, nombre: true } },
      departamentoExpedicion: { select: { id: true, nombre: true } },
      ciudadExpedicion: { select: { id: true, nombre: true } },
    },
  });
  if (!docente) {
    throw new AppError(404, "Docente no encontrado");
  }

  const esPropio = req.usuario?.id === docente.usuarioId;
  const esRevisorCompleto = req.usuario && ["SAC", "TALENTO_HUMANO", "SUPER_USUARIO"].includes(req.usuario.rol);
  const esGestorDocumentalConAcceso = req.usuario?.rol === "GESTOR_DOCUMENTAL" && docente.documentacionAprobada;
  if (!esPropio && !esRevisorCompleto && !esGestorDocumentalConAcceso) {
    throw new AppError(403, "No tienes acceso a este docente");
  }

  res.json(docente);
};

/**
 * El propio docente marca "ya subí todo" cuando completó todos los documentos del
 * checklist (subidos, sin importar si ya fueron aprobados — el gatillo es "subió
 * todo", no "le aprobaron todo"). Notifica a todo el personal revisor para que no
 * tengan que estar chequeando el progreso manualmente.
 *
 * Repetible: si después de finalizar un validador rechaza un documento,
 * `validarDocumento` resetea `documentacionFinalizada` a false — el docente corrige
 * y vuelve a subirlo (vía POST /api/documentos), y puede llamar este endpoint de
 * nuevo para re-notificar al personal revisor. Por eso un documento en RECHAZADO
 * cuenta como "faltante" acá (a diferencia del checklist normal): no tendría
 * sentido avisar "ya está listo para revisar" con una corrección pendiente.
 */
export const finalizarDocumentacion = async (req: Request, res: Response) => {
  const { id } = req.params;

  const docente = await prisma.docente.findUnique({
    where: { id },
    include: { usuario: { select: { id: true, nombres: true, apellidos: true } } },
  });
  if (!docente) {
    throw new AppError(404, "Docente no encontrado");
  }

  if (req.usuario?.id !== docente.usuarioId) {
    throw new AppError(403, "Solo el propio docente puede finalizar su documentación");
  }

  const [tipos, documentos] = await Promise.all([
    prisma.tipoDocumento.findMany({ select: { codigo: true, id: true } }),
    prisma.documento.findMany({ where: { docenteId: id }, select: { tipoDocumentoId: true, estado: true } }),
  ]);

  const subidosPorTipo = new Map(documentos.map((d) => [d.tipoDocumentoId, d.estado]));
  const faltantes = tipos.filter((tipo) => {
    const estado = subidosPorTipo.get(tipo.id);
    return !estado || estado === "ARCHIVO_ELIMINADO" || estado === "RECHAZADO";
  });

  if (faltantes.length > 0) {
    throw new AppError(
      400,
      `Todavía faltan documentos por subir o corregir: ${faltantes.map((t) => t.codigo).join(", ")}`,
    );
  }

  const docenteActualizado = await prisma.docente.update({
    where: { id },
    data: { documentacionFinalizada: true, documentacionFinalizadaEn: new Date() },
  });

  // "Terminé de subir el resto del checklist" solo le compete a TALENTO_HUMANO
  // (+ SUPER_USUARIO) — son quienes validan esos 24 documentos, no la autorización
  // de notificación electrónica (eso es SAC, ver documentos.controller.ts).
  // GESTOR_DOCUMENTAL tampoco participa de la revisión de documentos pendientes
  // (ver nota de rol al inicio del archivo), así que no se le notifica.
  const revisores = await prisma.usuario.findMany({
    where: { rol: { in: ["TALENTO_HUMANO", "SUPER_USUARIO"] }, activo: true },
    select: { id: true, email: true },
  });

  const mensaje = `${docente.usuario.nombres} ${docente.usuario.apellidos} finalizó la carga de sus documentos y está lista para revisión.`;
  await Promise.all(
    revisores.map((revisor) =>
      notificar({
        usuarioId: revisor.id,
        tipo: "DOCUMENTACION_LISTA_REVISION",
        mensaje,
        email: {
          asunto: "Documentación lista para revisión",
          badgeTexto: "Lista para revisión",
          badgeTono: "info",
          encabezado: "Documentación lista para revisión",
          parrafos: [mensaje],
          ctaTexto: "Ir a la bandeja de validación",
          ctaUrl: URL_LOGIN,
        },
      }),
    ),
  );

  res.json(docenteActualizado);
};

/**
 * Descarga un .zip con los documentos APROBADOS de un docente (respaldo interno,
 * una vez su proceso de posesión está completo). Solo lo aprobado: ni pendientes/en
 * revisión/rechazados, ni nada que el trigger haya marcado ARCHIVO_ELIMINADO.
 */
export const descargarDocumentos = async (req: Request, res: Response) => {
  const { id } = req.params;

  const docente = await prisma.docente.findUnique({
    where: { id },
    include: { usuario: { select: { cedula: true, nombres: true, apellidos: true } } },
  });
  if (!docente) {
    throw new AppError(404, "Docente no encontrado");
  }

  // GESTOR_DOCUMENTAL solo puede descargar el respaldo de un docente con TODA su
  // documentación aprobada (ver nota de rol al inicio del archivo); los demás
  // roles con acceso a esta ruta (SAC/TALENTO_HUMANO/SUPER_USUARIO) no
  // tienen esta restricción.
  if (req.usuario?.rol === "GESTOR_DOCUMENTAL" && !docente.documentacionAprobada) {
    throw new AppError(403, "Solo puedes descargar el respaldo de docentes con toda su documentación aprobada");
  }

  const documentosAprobados = await prisma.documento.findMany({
    where: { docenteId: id, estado: "APROBADO" },
    include: { tipoDocumento: { select: { codigo: true, orden: true } } },
    orderBy: { tipoDocumento: { orden: "asc" } },
  });

  if (documentosAprobados.length === 0) {
    throw new AppError(404, "Este docente no tiene documentos aprobados todavía");
  }

  const nombreArchivo = `${docente.usuario.cedula}-${docente.usuario.apellidos}-${docente.usuario.nombres}`
    .replace(/\s+/g, "")
    .replace(/[^\w-]/g, "");

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo}.zip"`);

  const archive = new ZipArchive({ zlib: { level: 9 } });
  // Los headers (y probablemente parte del cuerpo) ya se enviaron para cuando esto
  // puede fallar, así que no se puede responder con un JSON de error a esta altura:
  // solo se registra en el log y se corta la conexión.
  archive.on("error", (err) => {
    console.error(`Error generando el .zip del docente ${id}:`, err);
    res.destroy();
  });
  archive.pipe(res);

  try {
    for (const documento of documentosAprobados) {
      const buffer = await descargarArchivoDocumento(documento.archivoPath);
      const extension = documento.archivoNombre.split(".").pop() ?? "pdf";
      const nombreEnZip = `${String(documento.tipoDocumento.orden).padStart(2, "0")}_${documento.tipoDocumento.codigo}.${extension}`;
      archive.append(buffer, { name: nombreEnZip });
    }
    await archive.finalize();
  } catch (err) {
    console.error(`Error generando el .zip del docente ${id}:`, err);
    res.destroy();
  }
};

const informacionAdicionalSchema = z
  .object({
    sexo: z.enum(["MASCULINO", "FEMENINO"]),
    fechaNacimiento: z.coerce.date(),
    paisNacimiento: z.string().min(1),
    departamentoNacimientoId: z.string().uuid().optional(),
    ciudadNacimientoId: z.string().uuid().optional(),
    cantidadHijos: z.coerce.number().int().min(0),
    fechaExpedicionCedula: z.coerce.date(),
    departamentoExpedicionId: z.string().uuid(),
    ciudadExpedicionId: z.string().uuid(),
    estadoCivil: z.enum(["SOLTERO", "CASADO", "UNION_LIBRE", "SEPARADO", "DIVORCIADO", "VIUDO"]).optional(),
    tipoSangre: z
      .enum(["O_POSITIVO", "O_NEGATIVO", "A_POSITIVO", "A_NEGATIVO", "B_POSITIVO", "B_NEGATIVO", "AB_POSITIVO", "AB_NEGATIVO"])
      .optional(),
    direccion: z.string().min(1).optional(),
  })
  .refine((datos) => datos.paisNacimiento !== "Colombia" || (datos.departamentoNacimientoId && datos.ciudadNacimientoId), {
    message: "Debes indicar departamento y ciudad de nacimiento cuando el país de nacimiento es Colombia",
    path: ["departamentoNacimientoId"],
  });

/**
 * El propio docente completa la información adicional (datos personales exigidos
 * para el proceso de posesión, más allá de lo pedido en el registro básico).
 * Marca `informacionAdicionalCompleta = true`, lo que junto con
 * `debeCompletarInformacionAdicional` desbloquea POST /api/documentos (ver
 * `subirDocumento`). Los docentes que ya existían antes de este campo tienen
 * `debeCompletarInformacionAdicional = false` y nunca dependen de esto — pero
 * igual pueden llamar este endpoint si quieren dejar la info registrada.
 */
export const actualizarInformacionAdicional = async (req: Request, res: Response) => {
  const { id } = req.params;
  const datos = informacionAdicionalSchema.parse(req.body);

  const docente = await prisma.docente.findUnique({ where: { id } });
  if (!docente) throw new AppError(404, "Docente no encontrado");
  if (req.usuario?.id !== docente.usuarioId) {
    throw new AppError(403, "Solo el propio docente puede completar su información adicional");
  }

  const [departamentoExpedicion, ciudadExpedicion] = await Promise.all([
    prisma.departamento.findUnique({ where: { id: datos.departamentoExpedicionId } }),
    prisma.ciudad.findUnique({ where: { id: datos.ciudadExpedicionId } }),
  ]);
  if (!departamentoExpedicion || !ciudadExpedicion || ciudadExpedicion.departamentoId !== datos.departamentoExpedicionId) {
    throw new AppError(400, "Departamento/ciudad de expedición inválidos");
  }

  if (datos.departamentoNacimientoId || datos.ciudadNacimientoId) {
    const [departamentoNacimiento, ciudadNacimiento] = await Promise.all([
      datos.departamentoNacimientoId ? prisma.departamento.findUnique({ where: { id: datos.departamentoNacimientoId } }) : null,
      datos.ciudadNacimientoId ? prisma.ciudad.findUnique({ where: { id: datos.ciudadNacimientoId } }) : null,
    ]);
    if (
      !departamentoNacimiento ||
      !ciudadNacimiento ||
      ciudadNacimiento.departamentoId !== datos.departamentoNacimientoId
    ) {
      throw new AppError(400, "Departamento/ciudad de nacimiento inválidos");
    }
  }

  const docenteActualizado = await prisma.docente.update({
    where: { id },
    data: { ...datos, informacionAdicionalCompleta: true },
  });

  res.json(docenteActualizado);
};
