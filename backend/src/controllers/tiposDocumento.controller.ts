import type { Request, Response } from "express";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve TODOS los tipos de documento, incluido el de autorización de
 * notificación electrónica (esRequisitoRegistro=true) — el frontend lo
 * necesita para saber qué tipoDocumentoId usar al completar el registro.
 * El checklist con el estado de cada documento de un docente puntual se sirve
 * aparte, en GET /api/docentes/:id/checklist (incluye este tipo también).
 */
export const listarTiposDocumento = async (_req: Request, res: Response) => {
  const tipos = await prisma.tipoDocumento.findMany({
    orderBy: { orden: "asc" },
  });

  res.json(tipos);
};
