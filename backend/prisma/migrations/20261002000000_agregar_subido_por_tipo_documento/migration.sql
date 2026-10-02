-- CreateEnum
CREATE TYPE "SubidoPor" AS ENUM ('DOCENTE', 'TALENTO_HUMANO', 'GESTOR_DOCUMENTAL');

-- AlterTable
ALTER TABLE "tipos_documento" ADD COLUMN     "subidoPor" "SubidoPor" NOT NULL DEFAULT 'DOCENTE';
