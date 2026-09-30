-- Renombra VALIDADOR a TALENTO_HUMANO (0 usuarios con este rol al momento de
-- escribir esta migración, pero RENAME VALUE preserva datos de todas formas) y
-- agrega el nuevo rol SAC, que se encarga exclusivamente de aprobar/rechazar la
-- autorización de notificación electrónica (el resto del checklist queda a
-- cargo de Talento Humano). Ver controllers para la restricción por tipo de
-- documento en PATCH /api/documentos/:id/validar.
ALTER TYPE "RolNombre" RENAME VALUE 'VALIDADOR' TO 'TALENTO_HUMANO';
ALTER TYPE "RolNombre" ADD VALUE 'SAC';
