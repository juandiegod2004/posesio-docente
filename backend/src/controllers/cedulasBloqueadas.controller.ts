import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "@/lib/AppError";
import { prisma } from "@/lib/prisma";
import { cedulaSchema } from "@/lib/validaciones";

const agregarSchema = z.object({
  cedula: cedulaSchema,
  motivo: z.string().min(1, "Debes indicar un motivo"),
});

/**
 * Agrega una cédula a la lista negra — bloquea cualquier intento futuro de
 * registro con esa cédula (ver `registrar` en auth.controller.ts). Solo
 * Super Usuario. Si la cédula ya tiene una cuenta registrada, esto NO la
 * desactiva ni le impide seguir usando la plataforma — solo evita que alguien
 * vuelva a registrarse con esa cédula si la cuenta se borra en el futuro. Para
 * bloquear el acceso de una cuenta ya existente, usa `PATCH
 * /api/usuarios/:id/activo` por separado.
 */
export const agregarCedulaBloqueada = async (req: Request, res: Response) => {
  const { cedula, motivo } = agregarSchema.parse(req.body);

  const existente = await prisma.cedulaBloqueada.findUnique({ where: { cedula } });
  if (existente) {
    throw new AppError(409, "Esta cédula ya está en la lista negra");
  }

  const bloqueada = await prisma.cedulaBloqueada.create({
    data: { cedula, motivo, agregadoPorId: req.usuario!.id },
  });

  res.status(201).json(bloqueada);
};

/** Lista completa de cédulas bloqueadas, con motivo — solo Super Usuario. */
export const listarCedulasBloqueadas = async (_req: Request, res: Response) => {
  const cedulas = await prisma.cedulaBloqueada.findMany({ orderBy: { createdAt: "desc" } });
  res.json(cedulas);
};

/** Quita una cédula de la lista negra (ej. reporte erróneo) — solo Super Usuario. */
export const eliminarCedulaBloqueada = async (req: Request, res: Response) => {
  const { id } = req.params;

  const existente = await prisma.cedulaBloqueada.findUnique({ where: { id } });
  if (!existente) {
    throw new AppError(404, "No se encontró esa entrada en la lista negra");
  }

  await prisma.cedulaBloqueada.delete({ where: { id } });

  res.status(204).send();
};
