import { Router } from "express";
import { listarMisNotificaciones, marcarComoLeida } from "@/controllers/notificaciones.controller";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth } from "@/middlewares/auth.middleware";

export const notificacionesRouter = Router();

notificacionesRouter.get("/", requireAuth, asyncHandler(async (req, res) => listarMisNotificaciones(req, res)));
notificacionesRouter.patch("/:id/leida", requireAuth, asyncHandler(async (req, res) => marcarComoLeida(req, res)));
