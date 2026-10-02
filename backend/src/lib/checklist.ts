import { prisma } from "@/lib/prisma";

/**
 * true cuando todos los documentos que sube el propio docente (`subidoPor:
 * DOCENTE`, es decir todo el checklist excepto examen médico ocupacional y acta
 * de posesión) ya están en estado APROBADO. Controla dos cosas (2026-10-02):
 * - Cuándo TALENTO_HUMANO/GESTOR_DOCUMENTAL pueden subir esos 2 documentos
 *   (ver subirDocumento en documentos.controller.ts).
 * - Cuándo GESTOR_DOCUMENTAL puede ver/actuar sobre un docente (reemplaza el uso
 *   anterior de `documentacionAprobada`, que era circular: nunca se alcanza si
 *   nadie puede subir esos 2 últimos documentos todavía).
 */
export async function tieneDocumentosDocenteAprobados(docenteId: string): Promise<boolean> {
  const [totalTipos, aprobados] = await Promise.all([
    prisma.tipoDocumento.count({ where: { subidoPor: "DOCENTE" } }),
    prisma.documento.count({ where: { docenteId, estado: "APROBADO", tipoDocumento: { subidoPor: "DOCENTE" } } }),
  ]);
  return totalTipos > 0 && aprobados === totalTipos;
}
