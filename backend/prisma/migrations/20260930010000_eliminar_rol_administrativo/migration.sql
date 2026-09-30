-- AlterEnum
BEGIN;
CREATE TYPE "RolNombre_new" AS ENUM ('SUPER_USUARIO', 'VALIDADOR', 'DOCENTE', 'GESTOR_DOCUMENTAL');
ALTER TABLE "usuarios" ALTER COLUMN "rol" TYPE "RolNombre_new" USING ("rol"::text::"RolNombre_new");
ALTER TYPE "RolNombre" RENAME TO "RolNombre_old";
ALTER TYPE "RolNombre_new" RENAME TO "RolNombre";
DROP TYPE "public"."RolNombre_old";
COMMIT;

