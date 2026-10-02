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

// TALENTO_HUMANO y GESTOR_DOCUMENTAL pueden llamar esto también (2026-10-02) —
// suben el examen médico ocupacional y el acta de posesión respectivamente, los
// 2 únicos tipos de documento que no sube el propio docente (ver subirDocumento,
// que valida que cada rol solo pueda subir el tipo que le corresponde).
documentosRouter.post(
  "/",
  requireAuth,
  requireRole("DOCENTE", "TALENTO_HUMANO", "GESTOR_DOCUMENTAL", "SUPER_USUARIO"),
  upload.single("archivo"),
  asyncHandler(async (req, res) => subirDocumento(req, res)),
);

documentosRouter.get("/:id/url", requireAuth, asyncHandler(async (req, res) => obtenerUrlDocumento(req, res)));

documentosRouter.patch(
  "/:id/validar",
  requireAuth,
  requireRole("SAC", "TALENTO_HUMANO", "GESTOR_DOCUMENTAL", "SUPER_USUARIO"),
  asyncHandler(async (req, res) => validarDocumento(req, res)),
);
