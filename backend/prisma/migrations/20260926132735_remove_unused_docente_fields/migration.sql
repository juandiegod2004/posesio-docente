/*
  Warnings:

  - You are about to drop the column `actoNombramientoNro` on the `docentes` table. All the data in the column will be lost.
  - You are about to drop the column `cargo` on the `docentes` table. All the data in the column will be lost.
  - You are about to drop the column `institucionEducativa` on the `docentes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "docentes" DROP COLUMN "actoNombramientoNro",
DROP COLUMN "cargo",
DROP COLUMN "institucionEducativa";
