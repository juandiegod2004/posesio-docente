import { Router } from "express";
import multer from "multer";
import { listarDocumentos, obtenerUrlDocumento, subirDocumento, validarDocumento } from "@/controllers/documentos.controller";
import { AppError } from "@/lib/AppError";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new AppError(400, "Solo se aceptan archivos PDF"));
      return;
    }
    cb(null, true);
  },
});

export const documentosRouter = Router();

documentosRouter.get(
  "/",
  requireAuth,
  requireRole("SAC", "TALENTO_HUMANO", "SUPER_USUARIO", "GESTOR_DOCUMENTAL"),
  asyncHandler(async (req, res) => listarDocumentos(req, res)),
);

documentosRouter.post(
  "/",
  requireAuth,
  requireRole("DOCENTE"),
  upload.single("archivo"),
  asyncHandler(async (req, res) => subirDocumento(req, res)),
);

documentosRouter.get("/:id/url", requireAuth, asyncHandler(async (req, res) => obtenerUrlDocumento(req, res)));

documentosRouter.patch(
  "/:id/validar",
  requireAuth,
  requireRole("SAC", "TALENTO_HUMANO", "SUPER_USUARIO"),
  asyncHandler(async (req, res) => validarDocumento(req, res)),
);
