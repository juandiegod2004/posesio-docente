# posesion-docentes-backend

API para el proceso de posesión de docentes de la Secretaría de Educación del Magdalena (SED Magdalena).

## Stack

- **Express + TypeScript** — API HTTP
- **Prisma** — ORM sobre Postgres
- **Supabase** (self-hosted vía Docker) — Auth, Postgres y Storage
- **Resend** — correo transaccional (dominio propio, no el SMTP institucional .gov.co)

## Requisitos

- Node.js 20+
- Docker (para levantar Supabase local)

## Arranque en local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Levantar Supabase local (Postgres + Auth + Storage vía Docker). Esto también
   crea el bucket `documentos-docentes` automáticamente (declarado en
   `supabase/config.toml`, bajo `[storage.buckets.documentos-docentes]`):

   ```bash
   npx supabase init   # solo la primera vez
   npm run supabase:start
   npm run supabase:status   # imprime las claves anon/service_role y la URL
   ```

3. Copiar `.env.example` a `.env` y completar con los valores de `supabase status`
   (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
   y una API key de [Resend](https://resend.com).

4. Aplicar el esquema y los datos base:

   ```bash
   npm run prisma:migrate -- --name init
   npm run prisma:seed
   ```

5. Levantar la API:

   ```bash
   npm run dev
   ```

   Verificar en `http://localhost:4000/health`.

6. Activar RLS en la tabla interna de Prisma (una sola vez por entorno — no se
   puede meter en una migración normal porque el motor de migraciones de
   Prisma no maneja esa tabla; el resto de tablas sí quedan cerradas vía
   migraciones normales):

   ```bash
   npx supabase status   # copia el DB_URL
   psql "<DB_URL>" -c 'ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;'
   ```

   (En local, alternativamente: `docker exec supabase_db_backend psql -U postgres -d postgres -c 'ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;'`)

   **Nota:** esto es distinto del caso de la migración `detectar_archivo_eliminado_storage`
   (trigger sobre `storage.objects` para detectar borrados manuales de archivos — ver
   `API.md`, estado `ARCHIVO_ELIMINADO`). Esa migración SÍ queda versionada normalmente
   y `prisma migrate deploy` la aplica sola en cualquier entorno nuevo (VPS incluido) — el
   único problema fue local, al crearla con `prisma migrate dev`, porque la shadow database
   de Prisma no tiene el schema `storage` de Supabase. Si en el futuro se necesita otra
   migración que toque `storage.*` o cualquier schema fuera de `public`, aplicarla con
   `npx prisma db execute --file <ruta-al-migration.sql>` y luego
   `npx prisma migrate resolve --applied <nombre-de-la-migración>` en vez de `migrate dev`.

7. Crear el primer Super Usuario (no hay forma de crearlo por la API, porque
   crear personal interno requiere ya estar autenticado como Super Usuario):

   ```bash
   npm run crear:super-usuario -- <cedula> <nombres> <apellidos> <email> <password>
   ```

   Con esa cuenta ya puedes llamar `POST /api/usuarios` para crear las cuentas
   de Validador, Administrativo y Pre-acta.

## API

Referencia completa de endpoints (auth, roles, request/response de cada uno) en [`API.md`](./API.md).

## Estructura

```
src/
  config/        # carga y validación de variables de entorno
  controllers/    # lógica de cada endpoint
  routes/         # definición de rutas Express
  middlewares/    # auth (JWT de Supabase), manejo de errores
  services/       # lógica de negocio transversal (notificaciones)
  lib/            # clientes (Prisma, Supabase, Resend) y utilidades
prisma/
  schema.prisma  # modelos de datos
  seed.ts        # catálogo inicial de tipos de documento
```

## Pendientes conocidos

- Definir el paso de "confirmación de correo institucional" previo al registro
  (`POST /api/auth/registro` asume que ese paso ya ocurrió).
- Integrar la verificación de firma con Ciudadano Digital para el documento de
  autorización de notificación electrónica.
- RLS está activado (sin políticas) en las tablas de negocio, así que quedan
  cerradas a la API REST/GraphQL automática de Supabase; si en el futuro el
  frontend necesita leer algo directo de Supabase (no vía Express), hay que
  escribir políticas explícitas para esa tabla.
- `API.md` es una referencia manual; si se vuelve repetitivo escribir los
  `fetch` del frontend a mano, considerar pasar a OpenAPI + generación de
  cliente TypeScript.
