import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";

interface DepartamentoRaw {
  id: number;
  name: string;
}

interface CiudadRaw {
  id: number;
  name: string;
  departmentId: number;
}

/**
 * Importa el catálogo de departamentos y municipios de Colombia (códigos DIVIPOLA
 * reales, dataset de github.com/proyecto26/colombia — extraído del DANE) a las
 * tablas `departamentos`/`ciudades`. Idempotente: usa upsert por código DIVIPOLA,
 * se puede correr de nuevo sin duplicar nada.
 */
async function main() {
  const departamentosRaw: DepartamentoRaw[] = JSON.parse(
    readFileSync(path.join(process.cwd(), "prisma/data/colombia-departamentos.json"), "utf-8"),
  ).data;
  const ciudadesRaw: CiudadRaw[] = JSON.parse(
    readFileSync(path.join(process.cwd(), "prisma/data/colombia-ciudades.json"), "utf-8"),
  ).data;

  console.log(`Importando ${departamentosRaw.length} departamentos...`);
  const idPorCodigo = new Map<number, string>();
  for (const dep of departamentosRaw) {
    const codigoDivipola = String(dep.id).padStart(2, "0");
    const registro = await prisma.departamento.upsert({
      where: { codigoDivipola },
      update: { nombre: dep.name },
      create: { codigoDivipola, nombre: dep.name },
    });
    idPorCodigo.set(dep.id, registro.id);
  }

  console.log(`Importando ${ciudadesRaw.length} ciudades/municipios...`);
  let importadas = 0;
  for (const ciudad of ciudadesRaw) {
    const departamentoId = idPorCodigo.get(ciudad.departmentId);
    if (!departamentoId) {
      console.warn(`Ciudad "${ciudad.name}" (${ciudad.id}) sin departamento conocido (departmentId=${ciudad.departmentId}), se omite`);
      continue;
    }
    const codigoDivipola = String(ciudad.id).padStart(5, "0");
    await prisma.ciudad.upsert({
      where: { codigoDivipola },
      update: { nombre: ciudad.name, departamentoId },
      create: { codigoDivipola, nombre: ciudad.name, departamentoId },
    });
    importadas++;
  }

  console.log(`Listo: ${idPorCodigo.size} departamentos, ${importadas} ciudades.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
