import { Router } from "express";
import { authRouter } from "@/routes/auth.routes";
import { catalogosRouter } from "@/routes/catalogos.routes";
import { docentesRouter } from "@/routes/docentes.routes";
import { documentosRouter } from "@/routes/documentos.routes";
import { notificacionesRouter } from "@/routes/notificaciones.routes";
import { tiposDocumentoRouter } from "@/routes/tiposDocumento.routes";
import { usuariosRouter } from "@/routes/usuarios.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/catalogos", catalogosRouter);
apiRouter.use("/docentes", docentesRouter);
apiRouter.use("/documentos", documentosRouter);
apiRouter.use("/notificaciones", notificacionesRouter);
apiRouter.use("/tipos-documento", tiposDocumentoRouter);
apiRouter.use("/usuarios", usuariosRouter);
