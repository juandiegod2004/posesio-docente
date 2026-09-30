-- AlterEnum
ALTER TYPE "TipoNotificacion" ADD VALUE 'RESTABLECIMIENTO_CLAVE';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false;

