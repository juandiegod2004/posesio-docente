-- Activa Row Level Security en todas las tablas de la aplicación.
-- No se agregan políticas: el backend (Express) accede vía service_role
-- (que siempre ignora RLS) y Prisma se conecta directo a Postgres, así que
-- esto no cambia el comportamiento de la API. Lo que sí hace es cerrar por
-- completo el acceso a estas tablas desde la API REST/GraphQL automática de
-- Supabase (PostgREST) para las claves anon/authenticated, que de otro modo
-- quedarían "UNRESTRICTED" (legibles/escribibles sin pasar por el backend).

ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "docentes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tipos_documento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documentos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "validaciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notificaciones" ENABLE ROW LEVEL SECURITY;
