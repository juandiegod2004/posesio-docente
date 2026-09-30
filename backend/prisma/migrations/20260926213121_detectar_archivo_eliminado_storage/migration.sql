-- AlterEnum
ALTER TYPE "EstadoDocumento" ADD VALUE 'ARCHIVO_ELIMINADO';

-- Trigger: si alguien borra un archivo directamente del bucket "documentos-docentes"
-- (desde Supabase Studio, la API de Storage o un cliente S3), en vez de solo por
-- POST /api/documentos (que ya borra el archivo VIEJO después de subir uno nuevo,
-- así que este trigger no interfiere con ese flujo normal), el documento en BD
-- queda marcado como ARCHIVO_ELIMINADO en vez de seguir mostrando el estado anterior
-- como si el archivo todavía existiera.
CREATE OR REPLACE FUNCTION public.marcar_documento_archivo_eliminado()
RETURNS trigger AS $$
BEGIN
  IF OLD.bucket_id = 'documentos-docentes' THEN
    UPDATE documentos
    SET estado = 'ARCHIVO_ELIMINADO'::"EstadoDocumento",
        "comentarioValidador" = 'El archivo fue eliminado del almacenamiento fuera de la aplicación. Debes volver a subirlo.'
    WHERE "archivoPath" = OLD.name;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_documento_archivo_eliminado ON storage.objects;

CREATE TRIGGER trigger_documento_archivo_eliminado
AFTER DELETE ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.marcar_documento_archivo_eliminado();
