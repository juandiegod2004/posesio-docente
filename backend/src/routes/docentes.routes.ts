import { Router } from "express";
import {
  actualizarInformacionAdicional,
  descargarDocumentos,
  finalizarDocumentacion,
  listarDocentes,
  obtenerChecklist,
  obtenerPerfilDocente,
} from "@/controllers/docentes.controller";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";

export const docentesRouter = Router();

docentesRouter.get(
  "/",
  requireAuth,
  requireRole("SAC", "TALENTO_HUMANO", "SUPER_USUARIO", "GESTOR_DOCUMENTAL"),
  asyncHandler(async (req, res) => listarDocentes(req, res)),
);

// El control de acceso fino (propio docente / revisor completo / gestor documental
// con documentación aprobada) se hace dentro del controlador, no acá con requireRole.
docentesRouter.get("/:id", requireAuth, asyncHandler(async (req, res) => obtenerPerfilDocente(req, res)));

docentesRouter.get("/:id/checklist", requireAuth, asyncHandler(async (req, res) => obtenerChecklist(req, res)));

docentesRouter.patch("/:id/finalizar", requireAuth, asyncHandler(async (req, res) => finalizarDocumentacion(req, res)));

docentesRouter.patch(
  "/:id/informacion-adicional",
  requireAuth,
  asyncHandler(async (req, res) => actualizarInformacionAdicional(req, res)),
);

docentesRouter.get(
  "/:id/descargar",
  requireAuth,
  requireRole("SAC", "TALENTO_HUMANO", "SUPER_USUARIO", "GESTOR_DOCUMENTAL"),
  asyncHandler(async (req, res) => descargarDocumentos(req, res)),
);
