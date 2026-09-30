import type { Request, Response } from "express";
import { prisma } from "@/lib/prisma";

export const listarMisNotificaciones = async (req: Request, res: Response) => {
  const notificaciones = await prisma.notificacion.findMany({
    where: { usuarioId: req.usuario!.id, canal: "IN_APP" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json(notificaciones);
};

export const marcarComoLeida = async (req: Request, res: Response) => {
  const { id } = req.params;

  const notificacion = await prisma.notificacion.updateMany({
    where: { id, usuarioId: req.usuario!.id },
    data: { leida: true },
  });

  res.json({ actualizadas: notificacion.count });
};
