-- CreateEnum
CREATE TYPE "RolNombre" AS ENUM ('SUPER_USUARIO', 'ADMINISTRATIVO', 'VALIDADOR', 'DOCENTE', 'PRE_ACTA');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "CanalNotificacion" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('REGISTRO', 'DOCUMENTO_EN_REVISION', 'DOCUMENTO_APROBADO', 'DOCUMENTO_RECHAZADO', 'RECORDATORIO', 'OTRO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" "RolNombre" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docentes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "institucionEducativa" TEXT,
    "cargo" TEXT,
    "actoNombramientoNro" TEXT,
    "registroCompletado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "esRequisitoRegistro" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "tipoDocumentoId" TEXT NOT NULL,
    "archivoPath" TEXT NOT NULL,
    "archivoNombre" TEXT NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'PENDIENTE',
    "comentarioValidador" TEXT,
    "subidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validaciones" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "validadorId" TEXT NOT NULL,
    "estadoResultante" "EstadoDocumento" NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "canal" "CanalNotificacion" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cedula_key" ON "usuarios"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "docentes_usuarioId_key" ON "docentes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_documento_codigo_key" ON "tipos_documento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_docenteId_tipoDocumentoId_key" ON "documentos"("docenteId", "tipoDocumentoId");

-- AddForeignKey
ALTER TABLE "docentes" ADD CONSTRAINT "docentes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "docentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "tipos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validaciones" ADD CONSTRAINT "validaciones_validadorId_fkey" FOREIGN KEY ("validadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
