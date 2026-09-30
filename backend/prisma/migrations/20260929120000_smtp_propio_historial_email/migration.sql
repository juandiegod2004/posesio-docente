-- CreateEnum
CREATE TYPE "EstadoEnvioEmail" AS ENUM ('ENVIADO', 'FALLIDO');

-- AlterTable
ALTER TABLE "notificaciones" ADD COLUMN     "emailAsunto" TEXT,
ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "emailEstado" "EstadoEnvioEmail",
ADD COLUMN     "emailHtml" TEXT;

