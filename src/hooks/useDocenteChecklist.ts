'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ApiError, ChecklistItemBackend, EstadoDocumento, fetchChecklist } from '@/lib/api';
import { DOCENTE_CHECKLIST_META } from '@/lib/constants/docente-documents';
import { ChecklistDocumentItem, DocumentStatus } from '@/types/docente-checklist';

// ARCHIVO_ELIMINADO (alguien borró el archivo directo del storage) se trata visualmente
// igual que un rechazo: exige resubir. `archivoEliminado` abajo distingue el caso para
// ocultar el botón "Ver soporte" (el backend devuelve 410 al pedir su URL firmada).
const ESTADO_TO_STATUS: Record<EstadoDocumento, DocumentStatus> = {
  PENDIENTE: 'pendiente',
  EN_REVISION: 'en_revision',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
  ARCHIVO_ELIMINADO: 'rechazado',
};

const METADATA_BY_CODIGO = new Map(DOCENTE_CHECKLIST_META.map((meta) => [meta.codigo, meta]));

function mapChecklistItem(entry: ChecklistItemBackend): ChecklistDocumentItem {
  const meta = METADATA_BY_CODIGO.get(entry.codigo);
  const documento = entry.documento;

  return {
    id: meta?.id ?? 0,
    codigo: entry.codigo,
    tipoDocumentoId: entry.tipoDocumentoId,
    documentoId: documento?.id,
    title: meta?.title ?? entry.nombre,
    shortDescription: meta?.shortDescription,
    instructions: meta?.instructions ?? 'Consulta los requisitos de este documento con Talento Humano.',
    specialNote: meta?.specialNote,
    category: meta?.category,
    status: documento ? ESTADO_TO_STATUS[documento.estado] : 'pendiente',
    fileName: documento?.archivoNombre,
    uploadedAt: documento?.subidoEn,
    validatorComment: documento?.comentarioValidador ?? undefined,
    archivoEliminado: documento?.estado === 'ARCHIVO_ELIMINADO',
    subidoPor: entry.subidoPor,
  };
}

/** El examen médico ocupacional y el acta de posesión ya no los sube el docente (los sube
 * Talento Humano / Gestor Documental respectivamente, una vez el resto del checklist está
 * aprobado) — se ocultan por completo de la vista del docente, no hay nada que él pueda hacer. */
function esResponsabilidadDelDocente(item: ChecklistDocumentItem): boolean {
  return !item.subidoPor || item.subidoPor === 'DOCENTE';
}

/** Checklist real de los documentos del docente autenticado, contra el backend. */
export function useDocenteChecklist() {
  const { user, getAccessToken } = useAuth();
  const [items, setItems] = useState<ChecklistDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.docenteId) {
      setIsLoading(false);
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { checklist } = await fetchChecklist(token, user.docenteId);
      setItems(
        checklist
          .map(mapChecklistItem)
          .filter(esResponsabilidadDelDocente)
          .sort((a, b) => a.id - b.id)
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar tu checklist de documentos.');
    } finally {
      setIsLoading(false);
    }
  }, [user, getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, isLoading, error, reload: load };
}
