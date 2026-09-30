-- AlterEnum
ALTER TYPE "TipoNotificacion" ADD VALUE 'DOCUMENTACION_APROBADA';

-- AlterTable
ALTER TABLE "docentes" ADD COLUMN     "documentacionAprobada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "documentacionAprobadaEn" TIMESTAMP(3);

