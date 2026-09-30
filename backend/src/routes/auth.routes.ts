import { Router } from "express";
import { cambiarPassword, obtenerPerfil, registrar } from "@/controllers/auth.controller";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth } from "@/middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/registro", asyncHandler(async (req, res) => registrar(req, res)));
authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => obtenerPerfil(req, res)));
authRouter.post("/cambiar-password", requireAuth, asyncHandler(async (req, res) => cambiarPassword(req, res)));
