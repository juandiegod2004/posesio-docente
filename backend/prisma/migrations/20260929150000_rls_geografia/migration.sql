-- Activa RLS en las tablas nuevas del catálogo geográfico (departamentos/ciudades),
-- mismo patrón que el resto de tablas de negocio: sin políticas (default-deny vía
-- PostgREST), el backend (service_role) las sigue leyendo sin problema porque
-- service_role bypasea RLS. Ya se había activado a mano en Supabase Studio en este
-- entorno; esta migración lo deja versionado para que un `prisma migrate deploy`
-- en un entorno nuevo (ej. el VPS) también lo aplique.
ALTER TABLE "departamentos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ciudades" ENABLE ROW LEVEL SECURITY;
