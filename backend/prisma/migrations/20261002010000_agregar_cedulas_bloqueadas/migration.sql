-- CreateTable
CREATE TABLE "cedulas_bloqueadas" (
    "id" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "agregadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cedulas_bloqueadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cedulas_bloqueadas_cedula_key" ON "cedulas_bloqueadas"("cedula");
