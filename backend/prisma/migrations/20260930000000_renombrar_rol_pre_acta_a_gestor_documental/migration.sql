-- Renombra el valor del enum RolNombre de PRE_ACTA a GESTOR_DOCUMENTAL.
-- No hay ninguna fila que use PRE_ACTA al momento de escribir esta migración
-- (verificado antes de aplicarla), pero RENAME VALUE preserva cualquier dato
-- existente de todas formas, a diferencia de recrear el tipo desde cero.
ALTER TYPE "RolNombre" RENAME VALUE 'PRE_ACTA' TO 'GESTOR_DOCUMENTAL';
