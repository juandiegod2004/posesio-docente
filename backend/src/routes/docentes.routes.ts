import { Router } from "express";
import {
  actualizarInformacionAdicional,
  descargarDocumentos,
  descargarListadoAprobados,
  finalizarDocumentacion,
  listarDocentes,
  obtenerChecklist,
  obtenerPerfilDocente,
} from "@/controllers/docentes.controller";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";

export const docentesRouter = Router();

// SAC ya no tiene acceso al listado de docentes (2026-10-02) — solo ve la
// autorización de notificación electrónica vía la bandeja de documentos
// (ver documentos.routes.ts).
docentesRouter.get(
  "/",
  requireAuth,
  requireRole("TALENTO_HUMANO", "SUPER_USUARIO", "GESTOR_DOCUMENTAL"),
  asyncHandler(async (req, res) => listarDocentes(req, res)),
);

// Tiene que ir antes de "/:id" — si no, Express la confunde con un id.
docentesRouter.get(
  "/listado-aprobados",
  requireAuth,
  requireRole("TALENTO_HUMANO", "SUPER_USUARIO", "GESTOR_DOCUMENTAL"),
  asyncHandler(async (req, res) => descargarListadoAprobados(req, res)),
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
  requireRole("TALENTO_HUMANO", "SUPER_USUARIO", "GESTOR_DOCUMENTAL"),
  asyncHandler(async (req, res) => descargarDocumentos(req, res)),
);
