import { Router } from "express";
import { listarTiposDocumento } from "@/controllers/tiposDocumento.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/lib/asyncHandler";

export const tiposDocumentoRouter = Router();

tiposDocumentoRouter.get("/", requireAuth, asyncHandler(async (req, res) => listarTiposDocumento(req, res)));
