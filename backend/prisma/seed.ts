import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Catálogo oficial de documentos del proceso de posesión docente - SED Magdalena.
 * El de "autorización de notificación electrónica" (orden 0) es aparte de los 23:
 * se exige para completar el registro, antes de que el docente vea el checklist.
 */
const TIPOS_DOCUMENTO: Array<{
  codigo: string;
  nombre: string;
  descripcion?: string;
  obligatorio?: boolean;
  esRequisitoRegistro?: boolean;
  subidoPor?: "DOCENTE" | "TALENTO_HUMANO" | "GESTOR_DOCUMENTAL";
  orden: number;
}> = [
  {
    codigo: "AUTORIZACION_NOTIFICACION_ELECTRONICA",
    nombre: "Autorización de notificación electrónica (Ciudadano Digital)",
    esRequisitoRegistro: true,
    orden: 0,
  },
  {
    codigo: "CERTIFICADO_CUENTA_BANCARIA",
    nombre: "Certificado de cuenta bancaria actualizado y activado",
    orden: 1,
  },
  {
    codigo: "DECLARACION_NO_DEVENGA_SALARIO",
    nombre: "Oficio de no devengar salario del Estado y no incurrir en inhabilidad",
    descripcion:
      "Manifestación libre, bajo la gravedad de juramento, de que no devenga salario por parte del Estado y no se encuentra incurso en inhabilidad para ocupar cargos públicos.",
    orden: 2,
  },
  {
    codigo: "FORMATO_DECLARACION_JURAMENTADA",
    nombre: "Formato de declaración juramentada",
    orden: 3,
  },
  {
    codigo: "AFILIACION_CAJAMAG",
    nombre: "Formulario de afiliación a Cajamag",
    descripcion:
      "Última versión del formulario (verificar en la página de Cajamag), diligenciado y firmado. El proceso de afiliación debe radicarse personalmente en Cajamag, previa firma del Jefe de Talento Humano de la SED, adjuntando los documentos de los beneficiarios.",
    orden: 4,
  },
  {
    codigo: "FORMATO_FIDUPREVISORA",
    nombre: "Formato de Fiduprevisora",
    descripcion: "Diligenciado y firmado.",
    orden: 5,
  },
  {
    codigo: "FORMATO_BIENES_Y_RENTAS",
    nombre: "Formato de Bienes y Rentas de la Función Pública",
    descripcion: "Diligenciado y firmado (preferiblemente diligenciado en computador).",
    orden: 6,
  },
  {
    codigo: "CERTIFICADO_DELITOS_SEXUALES",
    nombre: "Certificado de delitos contra la libertad, integridad y formación sexuales",
    descripcion: "Debe estar actualizado.",
    orden: 7,
  },
  {
    codigo: "ANTECEDENTES_PROCURADURIA",
    nombre: "Antecedentes disciplinarios - Procuraduría",
    descripcion: "Debe estar actualizado.",
    orden: 8,
  },
  {
    codigo: "ANTECEDENTES_CONTRALORIA",
    nombre: "Antecedentes fiscales - Contraloría",
    descripcion: "Debe estar actualizado.",
    orden: 9,
  },
  {
    codigo: "ANTECEDENTES_MEDIDAS_CORRECTIVAS_POLICIA",
    nombre: "Antecedentes de medidas correctivas (RNMC) - Policía",
    descripcion: "Debe estar actualizado.",
    orden: 10,
  },
  {
    codigo: "ANTECEDENTES_JUDICIALES",
    nombre: "Antecedentes judiciales - Policía Nacional",
    descripcion: "Debe estar actualizado.",
    orden: 11,
  },
  {
    codigo: "EXPERIENCIA_LABORAL",
    nombre: "Certificados de experiencia laboral",
    descripcion: "Deben indicar cargo, fecha de ingreso y fecha de retiro.",
    orden: 12,
  },
  {
    codigo: "DIPLOMAS_ACTAS_GRADO_TARJETA_PROFESIONAL",
    nombre: "Diplomas, actas de grado y tarjeta profesional",
    descripcion:
      "Copia autenticada de los diplomas y actas de grado de los estudios formales (bachiller, normalista, licenciado, especialista y demás) y de la tarjeta profesional.",
    orden: 13,
  },
  {
    codigo: "HOJA_DE_VIDA",
    nombre: "Formato único de hoja de vida de la Función Pública",
    descripcion: "Diligenciado y firmado (preferiblemente diligenciado en computador).",
    orden: 14,
  },
  {
    codigo: "SITUACION_MILITAR",
    nombre: "Definición de situación militar",
    descripcion:
      "Libreta militar, o si el trámite está en curso, el certificado de constancia de que la situación militar se encuentra en proceso de definición.",
    orden: 15,
  },
  {
    codigo: "REGISTRO_CIVIL",
    nombre: "Registro civil legible",
    orden: 16,
  },
  {
    codigo: "FOTOCOPIA_CEDULA_150",
    nombre: "Fotocopia de la cédula al 150%",
    orden: 17,
  },
  {
    codigo: "OFICIO_ACEPTACION_NOMBRAMIENTO",
    nombre: "Oficio de aceptación del nombramiento",
    orden: 18,
  },
  {
    codigo: "NOTIFICACION_ACTO_NOMBRAMIENTO",
    nombre: "Notificación o comunicación del acto de nombramiento",
    orden: 19,
  },
  {
    codigo: "ACTO_DE_NOMBRAMIENTO",
    nombre: "Acto administrativo de nombramiento",
    orden: 20,
  },
  {
    codigo: "COMPROBANTE_PAGO_ESTAMPILLA",
    nombre: "Comprobante de pago de estampilla",
    descripcion:
      "Se paga en la Oficina de Gestión Tributaria (Calle 22 # 15-21, frente a la Clínica Cehoca, Santa Marta) o consultando a gestiontributaria@magdalena.gov.co.",
    orden: 21,
  },
  {
    codigo: "EXAMEN_MEDICO_OCUPACIONAL",
    nombre: "Examen médico ocupacional de ingreso",
    descripcion: "No tiene costo. No debe presentarse en ayunas. Debe realizarse en una IPS autorizada por la SED.",
    subidoPor: "TALENTO_HUMANO",
    orden: 22,
  },
  {
    codigo: "VALIDACION_TITULO",
    nombre: "Formato de validación de título",
    descripcion:
      "Documento mediante el cual el docente autoriza a la Secretaría de Educación del Magdalena a validar directamente con la institución educativa que expidió su título (licenciatura, normalista, especialización u otro) la autenticidad de dicho título.",
    orden: 23,
  },
  {
    codigo: "ACTA_DE_POSESION",
    nombre: "Acta de posesión",
    descripcion: "Documento entregado directamente en la Secretaría de Educación del Magdalena.",
    subidoPor: "GESTOR_DOCUMENTAL",
    orden: 24,
  },
];

async function main() {
  for (const tipo of TIPOS_DOCUMENTO) {
    await prisma.tipoDocumento.upsert({
      where: { codigo: tipo.codigo },
      update: {
        nombre: tipo.nombre,
        descripcion: tipo.descripcion ?? null,
        obligatorio: tipo.obligatorio ?? true,
        esRequisitoRegistro: tipo.esRequisitoRegistro ?? false,
        subidoPor: tipo.subidoPor ?? "DOCENTE",
        orden: tipo.orden,
      },
      create: {
        codigo: tipo.codigo,
        nombre: tipo.nombre,
        descripcion: tipo.descripcion,
        obligatorio: tipo.obligatorio ?? true,
        esRequisitoRegistro: tipo.esRequisitoRegistro ?? false,
        subidoPor: tipo.subidoPor ?? "DOCENTE",
        orden: tipo.orden,
      },
    });
  }

  console.log(`Seed completo: ${TIPOS_DOCUMENTO.length} tipos de documento.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
