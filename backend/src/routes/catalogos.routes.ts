import { Router } from "express";
import { listarCiudades, listarDepartamentos, listarPaises } from "@/controllers/catalogos.controller";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth } from "@/middlewares/auth.middleware";

export const catalogosRouter = Router();

catalogosRouter.get("/paises", requireAuth, asyncHandler(async (req, res) => listarPaises(req, res)));
catalogosRouter.get("/departamentos", requireAuth, asyncHandler(async (req, res) => listarDepartamentos(req, res)));
catalogosRouter.get("/ciudades", requireAuth, asyncHandler(async (req, res) => listarCiudades(req, res)));
