import { ChecklistDocumentItem } from '@/types/docente-checklist';

/**
 * Contenido estático (instrucciones, notas) de los 25 ítems del checklist oficial
 * (24 documentos de posesión + la autorización de notificación electrónica, id 0).
 * El estado real de cada uno (aprobado/rechazado/archivo radicado/etc.) viene siempre
 * del backend — esto solo aporta el texto de ayuda, unido por `codigo` con
 * TipoDocumento.codigo (ver backend/prisma/seed.ts).
 */
export type StaticChecklistMeta = Pick<
  ChecklistDocumentItem,
  'id' | 'codigo' | 'title' | 'shortDescription' | 'instructions' | 'specialNote' | 'category'
>;

export const DOCENTE_CHECKLIST_META: StaticChecklistMeta[] = [
  {
    id: 0,
    codigo: 'AUTORIZACION_NOTIFICACION_ELECTRONICA',
    title: 'Autorización de notificación electrónica (Ciudadano Digital)',
    shortDescription: 'Requisito para habilitar tu cuenta y el resto del checklist',
    instructions:
      'Autorización firmada a través de la plataforma Ciudadano Digital que habilita las notificaciones electrónicas de tu proceso de posesión.',
    specialNote: '📌 Debes subir este documento para completar tu registro.',
    category: 'registro',
  },
  {
    id: 1,
    codigo: 'CERTIFICADO_CUENTA_BANCARIA',
    title: 'Certificado de cuenta bancaria actualizado y activado',
    shortDescription: 'Cuenta de ahorros o corriente a nombre del docente',
    instructions:
      'Expedición no mayor a treinta (30) días calendario. La certificación debe indicar que la cuenta se encuentra ACTIVA y especificar tipo de cuenta y número legible.',
    category: 'financiero',
  },
  {
    id: 2,
    codigo: 'DECLARACION_NO_DEVENGA_SALARIO',
    title:
      'Oficio donde manifiesta libremente bajo gravedad de juramento que no devenga salario del Estado y que no está incurso en inhabilidad para cargos públicos',
    shortDescription: 'Manifestación juramentada de no doble asignación salarial',
    instructions:
      'Documento debidamente fechado y firmado en original o con firma digital válida. Debe incluir número de cédula y lugar de expedición.',
    category: 'legal',
  },
  {
    id: 3,
    codigo: 'FORMATO_DECLARACION_JURAMENTADA',
    title: 'Formato de declaración juramentada',
    shortDescription: 'Formato institucional de la Secretaría de Educación',
    instructions:
      'Diligenciar todos los campos sin tachones ni enmendaduras. Asegurarse de consignar la información completa del cónyuge y familiares en primer grado si aplica.',
    category: 'legal',
  },
  {
    id: 4,
    codigo: 'AFILIACION_CAJAMAG',
    title: 'Formulario de afiliación a CAJAMAG (última versión, diligenciado y firmado)',
    shortDescription: 'Caja de Compensación Familiar del Magdalena',
    instructions:
      'Descargue la última versión directamente desde el portal oficial de CAJAMAG (cajamag.com.co). Diligencie datos del trabajador y personas a cargo con sus respectivos anexos.',
    specialNote: '⚠️ Verificar que corresponda a la versión vigente en la página web de CAJAMAG.',
    category: 'seguridad_social',
  },
  {
    id: 5,
    codigo: 'FORMATO_FIDUPREVISORA',
    title: 'Formato de Fiduprevisora, diligenciado y firmado',
    shortDescription: 'Afiliación al Fondo Nacional de Prestaciones Sociales del Magisterio (FOMAG)',
    instructions:
      'Diligenciar completamente el formulario de registro y vinculación médica de la Fiduprevisora para docentes oficiales del departamento del Magdalena.',
    category: 'seguridad_social',
  },
  {
    id: 6,
    codigo: 'FORMATO_BIENES_Y_RENTAS',
    title: 'Formato de bienes y rentas de la función pública, diligenciado y firmado',
    shortDescription: 'Declaración juramentada en plataforma SIGEP II',
    instructions:
      'Generar la declaración de bienes y rentas desde el portal SIGEP II con corte al año fiscal inmediatamente anterior. Debe contener código de barras o verificación digital del DAFP.',
    category: 'legal',
  },
  {
    id: 7,
    codigo: 'CERTIFICADO_DELITOS_SEXUALES',
    title: 'Certificado de delitos contra la libertad, integridad y formación sexuales (actualizado)',
    shortDescription: 'Certificado oficial expedido por la Policía Nacional (Ley 1918 de 2018)',
    instructions:
      'Requisito obligatorio para todo personal con contacto con menores de edad. Fecha de expedición no mayor a 15 días.',
    category: 'antecedentes',
  },
  {
    id: 8,
    codigo: 'ANTECEDENTES_PROCURADURIA',
    title: 'Antecedentes Procuraduría (actualizado)',
    shortDescription: 'Certificado ordinario o especial de antecedentes disciplinarios',
    instructions: 'Descargado desde www.procuraduria.gov.co. Vigencia máxima de treinta (30) días a la fecha de radicación.',
    category: 'antecedentes',
  },
  {
    id: 9,
    codigo: 'ANTECEDENTES_CONTRALORIA',
    title: 'Antecedentes Contraloría (actualizado)',
    shortDescription: 'Boletín de responsables fiscales de la CGR',
    instructions:
      'Descargado desde www.contraloria.gov.co. Certifica la ausencia de deudas o responsabilidades fiscales pendientes con el Estado.',
    category: 'antecedentes',
  },
  {
    id: 10,
    codigo: 'ANTECEDENTES_MEDIDAS_CORRECTIVAS_POLICIA',
    title: 'Antecedentes de medidas correctivas RNMC Policía (actualizado)',
    shortDescription: 'Registro Nacional de Medidas Correctivas (Código de Policía)',
    instructions:
      'Expedido por la Policía Nacional. Debe certificar que no registra medidas correctivas pendientes por infracciones al Código Nacional de Policía y Convivencia.',
    category: 'antecedentes',
  },
  {
    id: 11,
    codigo: 'ANTECEDENTES_JUDICIALES',
    title: 'Antecedentes Policía (actualizado)',
    shortDescription: 'Certificado de antecedentes judiciales en línea',
    instructions: 'Consulta en línea de antecedentes judiciales de la Policía Nacional con fecha de consulta no superior a 15 días.',
    category: 'antecedentes',
  },
  {
    id: 12,
    codigo: 'EXPERIENCIA_LABORAL',
    title: 'Experiencia laboral (certificados con cargo, fecha de ingreso y fecha de retiro)',
    shortDescription: 'Certificaciones laborales de instituciones educativas públicas o privadas',
    instructions:
      'Cada certificación debe contener membrete, NIT, teléfono de contacto verificable, funciones desempeñadas, fecha exacta de inicio (DD/MM/AAAA) y retiro.',
    specialNote:
      'ℹ️ Si usted es Administrativo o Directivo Docente, este ítem aplica para usted; si no, omítalo. Cuando aplique, deben anexarse ordenados cronológicamente desde el más reciente al más antiguo en un solo PDF.',
    category: 'academico',
  },
  {
    id: 13,
    codigo: 'DIPLOMAS_ACTAS_GRADO_TARJETA_PROFESIONAL',
    title:
      'Copia autenticada de diplomas y actas de grado (bachiller, normalista, licenciado, especialista, etc.) y tarjeta profesional',
    shortDescription: 'Títulos académicos y tarjeta profesional o escalafón',
    instructions:
      'Escaneo a color de los diplomas con sus correspondientes actas de grado legibles. En caso de contar con tarjeta profesional o resolución de escalafón nacional docente, adjuntarla.',
    specialNote: 'Asegúrese de que el folio y número de libro de las actas de grado sean 100% legibles.',
    category: 'academico',
  },
  {
    id: 14,
    codigo: 'HOJA_DE_VIDA',
    title: 'Formato único de hoja de vida de la función pública, diligenciado y firmado',
    shortDescription: 'Formato DAFP para persona natural',
    instructions:
      'Diligenciado completamente en computador sin dejar campos obligatorios en blanco. Debe incluir la firma del docente en la última página.',
    category: 'legal',
  },
  {
    id: 15,
    codigo: 'SITUACION_MILITAR',
    title: 'Acreditar definición de situación militar (varones menores de 50 años) — libreta militar o soporte de trámite',
    shortDescription: 'Libreta militar de primera o segunda clase, o constancia de liquidación',
    instructions:
      'Aplica para varones menores de 50 años de edad. En caso de estar en trámite, adjuntar certificado oficial expedido por el Distrito Militar correspondiente.',
    specialNote:
      'ℹ️ Exclusivo para varones menores de 50 años. Si usted es mujer o mayor de 50 años, adjunte constancia o documento aclaratorio.',
    category: 'legal',
  },
  {
    id: 16,
    codigo: 'REGISTRO_CIVIL',
    title: 'Registro civil legible',
    shortDescription: 'Copia del registro civil de nacimiento',
    instructions: 'Copia nítida del registro civil expedido por Notaría o Registraduría Nacional del Estado Civil con sello legible.',
    category: 'legal',
  },
  {
    id: 17,
    codigo: 'FOTOCOPIA_CEDULA_150',
    title: 'Fotocopia de la cédula al 150%',
    shortDescription: 'Documento de identidad ampliado por ambas caras',
    instructions:
      'Fotocopia ampliada al 150% de la Cédula de Ciudadanía vigente (amarilla con hologramas o digital), ambas caras visibles en una sola página, nítida y legible.',
    category: 'legal',
  },
  {
    id: 18,
    codigo: 'OFICIO_ACEPTACION_NOMBRAMIENTO',
    title: 'Oficio de aceptación del nombramiento',
    shortDescription: 'Carta formal dirigida a la Secretaría de Educación del Magdalena',
    instructions:
      'Documento escrito donde el docente manifiesta expresamente la aceptación del cargo y la plaza asignada, indicando el número de acto administrativo correspondiente.',
    category: 'nombramiento',
  },
  {
    id: 19,
    codigo: 'NOTIFICACION_ACTO_NOMBRAMIENTO',
    title: 'Notificación o comunicación del acto de nombramiento',
    shortDescription: 'Comunicación oficial enviada por la Secretaría',
    instructions:
      'Copia de la constancia de notificación personal o por correo electrónico del decreto o resolución de nombramiento en periodo de prueba o propiedad.',
    category: 'nombramiento',
  },
  {
    id: 20,
    codigo: 'ACTO_DE_NOMBRAMIENTO',
    title: 'Acto administrativo de nombramiento',
    shortDescription: 'Decreto departamental de la Gobernación del Magdalena',
    instructions:
      'Copia íntegra del Decreto Departamental emitido por la Gobernación del Magdalena que formaliza el nombramiento en el cargo docente.',
    category: 'nombramiento',
  },
  {
    id: 21,
    codigo: 'COMPROBANTE_PAGO_ESTAMPILLA',
    title: 'Comprobante de pago de estampilla (Gestión Tributaria)',
    shortDescription: 'Recibo oficial de pago de la estampilla departamental Pro-Desarrollo',
    instructions:
      'Comprobante de liquidación y pago bancario emitido por la Dirección de Gestión Tributaria del Departamento del Magdalena para actos de nombramiento.',
    specialNote: 'Verifique que figure el timbre del banco y el código de barras de la transacción tributaria.',
    category: 'financiero',
  },
  {
    id: 22,
    codigo: 'EXAMEN_MEDICO_OCUPACIONAL',
    title: 'Examen médico ocupacional de ingreso (IPS autorizada)',
    shortDescription: 'Certificado de aptitud médica laboral para docencia',
    instructions:
      'Certificado de aptitud psicofísica y laboral expedido por una Institución Prestadora de Salud (IPS) autorizada y con licencia en Salud Ocupacional vigente.',
    specialNote: 'El examen debe tener una vigencia no mayor a 30 días calendario y declarar al docente APTO.',
    category: 'seguridad_social',
  },
  {
    id: 23,
    codigo: 'VALIDACION_TITULO',
    title: 'Formato de validación de título',
    shortDescription: 'Autorización para validar la autenticidad del título académico',
    instructions:
      'Formato mediante el cual el docente autoriza a la Secretaría de Educación del Magdalena a validar la autenticidad de su título académico directamente con la institución educativa que lo expidió.',
    category: 'academico',
  },
  {
    id: 24,
    codigo: 'ACTA_DE_POSESION',
    title: 'Acta de posesión',
    shortDescription: 'Documento final suscrito ante la autoridad nominadora o delegado',
    instructions:
      'Acta formal de posesión en el cargo docente. Se suscribe una vez aprobados los ítems anteriores ante la Secretaría de Educación o el Rector delegado.',
    specialNote: '📌 Este documento culmina el proceso oficial de vinculación.',
    category: 'nombramiento',
  },
];

/** Total de ítems del checklist (documentos de posesión + autorización de registro). */
export const TOTAL_CHECKLIST_ITEMS = DOCENTE_CHECKLIST_META.length;
