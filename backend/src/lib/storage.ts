import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/AppError";
import { supabaseAdmin } from "@/lib/supabase";

export const DOCUMENTOS_BUCKET = "documentos-docentes";

/** Sube el archivo al bucket de Supabase Storage y devuelve la ruta interna guardada en BD. */
export const subirArchivoDocumento = async (docenteId: string, tipoDocumentoCodigo: string, file: Express.Multer.File) => {
  const extension = file.originalname.split(".").pop() ?? "bin";
  const path = `${docenteId}/${tipoDocumentoCodigo}-${randomUUID()}.${extension}`;

  const { error } = await supabaseAdmin.storage.from(DOCUMENTOS_BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new AppError(500, `No se pudo subir el archivo: ${error.message}`);
  }

  return path;
};

/** Borra un archivo del bucket (usado al reemplazar un documento por una nueva versión). */
export const eliminarArchivoDocumento = async (path: string) => {
  const { error } = await supabaseAdmin.storage.from(DOCUMENTOS_BUCKET).remove([path]);

  if (error) {
    console.error(`No se pudo borrar el archivo anterior (${path}): ${error.message}`);
  }
};

/** Descarga el contenido de un archivo del bucket (usado para armar el .zip de respaldo). */
export const descargarArchivoDocumento = async (path: string) => {
  const { data, error } = await supabaseAdmin.storage.from(DOCUMENTOS_BUCKET).download(path);

  if (error || !data) {
    throw new AppError(500, `No se pudo descargar el archivo (${path}): ${error?.message ?? "desconocido"}`);
  }

  return Buffer.from(await data.arrayBuffer());
};

/** Genera una URL firmada temporal para que el validador o el docente puedan ver el archivo. */
export const obtenerUrlFirmada = async (path: string, expiraEnSegundos = 60 * 10) => {
  const { data, error } = await supabaseAdmin.storage.from(DOCUMENTOS_BUCKET).createSignedUrl(path, expiraEnSegundos);

  if (error || !data) {
    throw new AppError(500, `No se pudo generar la URL del archivo: ${error?.message ?? "desconocido"}`);
  }

  return data.signedUrl;
};
