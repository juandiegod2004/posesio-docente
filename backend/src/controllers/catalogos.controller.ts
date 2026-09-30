import type { Request, Response } from "express";
import { PAISES } from "@/lib/paises";
import { prisma } from "@/lib/prisma";

export const listarPaises = async (_req: Request, res: Response) => {
  res.json(PAISES);
};

export const listarDepartamentos = async (_req: Request, res: Response) => {
  const departamentos = await prisma.departamento.findMany({ orderBy: { nombre: "asc" } });
  res.json(departamentos);
};

export const listarCiudades = async (req: Request, res: Response) => {
  const { departamentoId } = req.query;
  const ciudades = await prisma.ciudad.findMany({
    where: departamentoId ? { departamentoId: String(departamentoId) } : undefined,
    orderBy: { nombre: "asc" },
  });
  res.json(ciudades);
};
