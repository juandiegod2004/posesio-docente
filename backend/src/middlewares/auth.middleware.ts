import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { RolNombre } from "@prisma/client";
import { AppError } from "@/lib/AppError";
import { asyncHandler } from "@/lib/asyncHandler";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Verifica el JWT de Supabase Auth enviado en `Authorization: Bearer <token>`,
 * carga el Usuario correspondiente desde la base de datos y lo adjunta a req.usuario.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;

  if (!token) {
    throw new AppError(401, "Token de autenticación requerido");
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new AppError(401, "Token inválido o expirado");
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: data.user.id } });

  if (!usuario || !usuario.activo) {
    // Mensaje genérico a propósito: no confirmar si la cuenta existe pero está
    // inactiva vs. otro motivo de rechazo (hallazgo de QA, riesgo bajo pero evitable).
    throw new AppError(403, "No autorizado");
  }

  req.usuario = {
    id: usuario.id,
    cedula: usuario.cedula,
    email: usuario.email,
    rol: usuario.rol,
  };

  next();
});

/** Restringe el acceso a los roles indicados. Debe usarse después de requireAuth. */
export const requireRole = (...roles: RolNombre[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) {
      throw new AppError(401, "No autenticado");
    }

    if (!roles.includes(req.usuario.rol)) {
      throw new AppError(403, "No tienes permisos para realizar esta acción");
    }

    next();
  };
};
