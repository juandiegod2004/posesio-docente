-- CreateEnum
CREATE TYPE "TipoPosesion" AS ENUM ('DOCENTE', 'ADMINISTRATIVO');

-- AlterEnum
ALTER TYPE "TipoNotificacion" ADD VALUE 'DOCUMENTACION_LISTA_REVISION';

-- AlterTable
ALTER TABLE "docentes" ADD COLUMN     "documentacionFinalizada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "documentacionFinalizadaEn" TIMESTAMP(3),
ADD COLUMN     "tipoPosesion" "TipoPosesion" NOT NULL DEFAULT 'DOCENTE';

