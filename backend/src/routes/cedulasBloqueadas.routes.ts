import { Router } from "express";
import { agregarCedulaBloqueada, eliminarCedulaBloqueada, listarCedulasBloqueadas } from "@/controllers/cedulasBloqueadas.controller";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";

export const cedulasBloqueadasRouter = Router();

cedulasBloqueadasRouter.use(requireAuth, requireRole("SUPER_USUARIO"));

cedulasBloqueadasRouter.get("/", asyncHandler(async (req, res) => listarCedulasBloqueadas(req, res)));
cedulasBloqueadasRouter.post("/", asyncHandler(async (req, res) => agregarCedulaBloqueada(req, res)));
cedulasBloqueadasRouter.delete("/:id", asyncHandler(async (req, res) => eliminarCedulaBloqueada(req, res)));
