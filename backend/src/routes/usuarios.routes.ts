import { Router } from "express";
import { actualizarEstadoActivo, crearUsuarioStaff, listarUsuariosStaff, restablecerClave } from "@/controllers/usuarios.controller";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";

export const usuariosRouter = Router();

usuariosRouter.use(requireAuth, requireRole("SUPER_USUARIO"));

usuariosRouter.post("/", asyncHandler(async (req, res) => crearUsuarioStaff(req, res)));
usuariosRouter.get("/", asyncHandler(async (req, res) => listarUsuariosStaff(req, res)));
usuariosRouter.patch("/:id/activo", asyncHandler(async (req, res) => actualizarEstadoActivo(req, res)));
usuariosRouter.patch("/:id/clave", asyncHandler(async (req, res) => restablecerClave(req, res)));
