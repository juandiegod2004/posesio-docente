-- CreateEnum
CREATE TYPE "TipoDocumentoIdentidad" AS ENUM ('CEDULA_CIUDADANIA', 'CEDULA_EXTRANJERIA', 'TARJETA_IDENTIDAD', 'PASAPORTE', 'PEP', 'PPT');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMENINO');

-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTERO', 'CASADO', 'UNION_LIBRE', 'SEPARADO', 'DIVORCIADO', 'VIUDO');

-- CreateEnum
CREATE TYPE "TipoSangre" AS ENUM ('O_POSITIVO', 'O_NEGATIVO', 'A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO');

-- AlterTable
ALTER TABLE "docentes" ADD COLUMN     "cantidadHijos" INTEGER,
ADD COLUMN     "ciudadExpedicionId" TEXT,
ADD COLUMN     "ciudadNacimientoId" TEXT,
ADD COLUMN     "debeCompletarInformacionAdicional" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "departamentoExpedicionId" TEXT,
ADD COLUMN     "departamentoNacimientoId" TEXT,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "estadoCivil" "EstadoCivil",
ADD COLUMN     "fechaExpedicionCedula" TIMESTAMP(3),
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3),
ADD COLUMN     "informacionAdicionalCompleta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paisNacimiento" TEXT,
ADD COLUMN     "sexo" "Sexo",
ADD COLUMN     "tipoSangre" "TipoSangre";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "tipoDocumento" "TipoDocumentoIdentidad" NOT NULL DEFAULT 'CEDULA_CIUDADANIA';

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "codigoDivipola" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciudades" (
    "id" TEXT NOT NULL,
    "codigoDivipola" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,

    CONSTRAINT "ciudades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_codigoDivipola_key" ON "departamentos"("codigoDivipola");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_nombre_key" ON "departamentos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ciudades_codigoDivipola_key" ON "ciudades"("codigoDivipola");

-- AddForeignKey
ALTER TABLE "docentes" ADD CONSTRAINT "docentes_departamentoNacimientoId_fkey" FOREIGN KEY ("departamentoNacimientoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docentes" ADD CONSTRAINT "docentes_ciudadNacimientoId_fkey" FOREIGN KEY ("ciudadNacimientoId") REFERENCES "ciudades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docentes" ADD CONSTRAINT "docentes_departamentoExpedicionId_fkey" FOREIGN KEY ("departamentoExpedicionId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docentes" ADD CONSTRAINT "docentes_ciudadExpedicionId_fkey" FOREIGN KEY ("ciudadExpedicionId") REFERENCES "ciudades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciudades" ADD CONSTRAINT "ciudades_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: los docentes que ya existían antes de este campo quedan eximidos del
-- bloqueo de "información adicional" para siempre (decisión explícita del usuario:
-- no se le exige retroactivamente a nadie que ya estaba en proceso). El default
-- `true` de la columna solo aplica hacia adelante, a los docentes creados después
-- de esta migración.
UPDATE "docentes" SET "debeCompletarInformacionAdicional" = false;

