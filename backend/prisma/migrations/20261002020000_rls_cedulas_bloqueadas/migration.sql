-- Activa RLS en cedulas_bloqueadas (se quedó afuera por error en la migración que
-- creó la tabla) — mismo patrón que el resto de tablas de negocio: sin
-- políticas (default-deny vía PostgREST, que usa la anon/authenticated key
-- expuesta al navegador). El backend (service_role) la sigue leyendo sin
-- problema porque service_role bypasea RLS. Sin esto, cualquiera con la
-- NEXT_PUBLIC_SUPABASE_ANON_KEY podía leer/escribir esta tabla directo contra
-- PostgREST sin pasar por el backend — datos sensibles (acusaciones de título
-- falso ligadas a cédulas reales).
ALTER TABLE "cedulas_bloqueadas" ENABLE ROW LEVEL SECURITY;
