# Despliegue en producción — VPS de Hostinger

Guía paso a paso para poner en producción **backend (Express) + frontend (Next.js) + Supabase self-hosted** en el mismo VPS de Hostinger, desde cero.

**Dominio**: en vez de comprar uno, usamos el hostname que Hostinger ya asigna gratis a cada VPS (algo como `srv123456.hstgr.cloud` — lo encuentras en hPanel → VPS → Overview, campo "Hostname"). Ya resuelve por DNS de fábrica, así que no hay que tocar ningún registro DNS ni esperar propagación. Como es un solo hostname (no puedes crear subdominios propios sobre él), diferenciamos frontend y Supabase por **puerto**, no por subdominio: el frontend en el puerto estándar `443`, Supabase en `8443`. A lo largo de esta guía, `HOSTNAME` = ese hostname (ej. `srv123456.hstgr.cloud`), reemplázalo por el tuyo en cada paso.

Arquitectura en el VPS:

```
Internet
  │
  ├── https://HOSTNAME        → Caddy → Next.js (puerto 3000, interno)
  │                                  │
  │                                  └── rewrite server-side /api/* → Express (puerto 4000, interno, NO expuesto)
  │
  └── https://HOSTNAME:8443   → Caddy → Kong / Supabase (puerto 8000, interno)
                                       (el navegador le habla DIRECTO a esto para login)
```

El backend Express **no necesita su propio dominio/HTTPS** — el frontend le pega server-side vía `NEXT_PUBLIC_API_URL=http://localhost:4000` (ver `next.config.ts`, sección `rewrites`). Solo Supabase necesita quedar público, porque el navegador llama directo a Supabase Auth para el login.

---

## 0. Antes de empezar

- [ ] Acceso SSH al VPS (IP, usuario, contraseña o llave).
- [ ] El hostname que te dio Hostinger (hPanel → VPS → Overview) — no hace falta comprar ni configurar ningún dominio.
- [ ] Credenciales SMTP de IONOS (ya las tienes en `backend/.env`).
- [ ] Site key + secret de Cloudflare Turnstile (ya las tienes).

---

## Fase 1 — Preparar el VPS

Conéctate por SSH (Hostinger te da la IP y la contraseña root en su panel):

```bash
ssh root@TU_IP_DEL_VPS
```

**1.1 Actualizar el sistema:**

```bash
apt update && apt upgrade -y
```

**1.2 Crear un usuario no-root** (evita trabajar como root todo el tiempo):

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

**1.3 Instalar Docker + Docker Compose:**

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# cierra sesión SSH y vuelve a entrar para que el grupo tome efecto
docker --version && docker compose version
```

**1.4 Instalar Node.js 20+:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # debe dar v20.x o más
```

**1.5 Instalar Caddy** (reverse proxy con HTTPS automático vía Let's Encrypt — no hay que tocar certificados a mano):

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

**1.6 Firewall** (SSH, HTTP, HTTPS y el puerto extra de Supabase quedan abiertos al exterior — todo lo demás, incluido Postgres y el backend, solo escucha en `localhost`):

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8443/tcp
sudo ufw enable
```

**1.7 Instalar PM2** (mantiene backend y frontend corriendo, reinicia solos si el proceso muere o el VPS reinicia):

```bash
sudo npm install -g pm2
```

---

## Fase 2 — Confirmar el hostname

No hay que tocar DNS: el hostname de Hostinger ya resuelve. Solo confirma cuál es el tuyo:

1. En hPanel → tu VPS → pestaña "Overview", copia el campo "Hostname" (formato `srvXXXXXX.hstgr.cloud` o similar).
2. Verifica que resuelve a la IP del VPS:

```bash
dig +short HOSTNAME
```

Debe devolver la misma IP por la que te conectas por SSH. Si no coincide, usa la IP directamente en vez del hostname en el resto de la guía (Let's Encrypt sí necesita el hostname real para emitir el certificado, así que confirma esto antes de seguir).

---

## Fase 3 — Supabase self-hosted (docker-compose oficial)

Esto es distinto de `npm run supabase:start` que usas en local (ese es solo para desarrollo, vía CLI). En producción se usa el docker-compose oficial del propio proyecto Supabase.

**3.1 Clonar el repo oficial de Supabase** (solo para sacar el `docker-compose.yml`, no es tu proyecto):

```bash
cd ~
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
```

**3.2 Generar los secretos.** Necesitas 3 valores: `POSTGRES_PASSWORD`, `JWT_SECRET`, y a partir de ese secret, `ANON_KEY`/`SERVICE_ROLE_KEY` (son JWTs firmados).

```bash
# Contraseña de Postgres
openssl rand -base64 32

# JWT_SECRET (guárdalo, lo vas a usar dos veces más abajo)
openssl rand -base64 48
```

Con el `JWT_SECRET` que te dio el comando anterior, genera las dos API keys con este script (ejecútalo en tu Mac o en el VPS, donde tengas Node — no necesita ninguna librería externa, usa solo el módulo `crypto` nativo):

```bash
node -e "
const crypto = require('crypto');
const secret = process.argv[1]; // tu JWT_SECRET, pásalo como argumento

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+\$/,'');
}
function generarJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const data = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+\$/,'');
  return data + '.' + signature;
}

const now = Math.floor(Date.now() / 1000);
const exp = now + 315360000; // 10 años

console.log('ANON_KEY=' + generarJWT({ role: 'anon', iss: 'supabase', iat: now, exp }));
console.log('SERVICE_ROLE_KEY=' + generarJWT({ role: 'service_role', iss: 'supabase', iat: now, exp }));
" "PEGA_AQUI_TU_JWT_SECRET"
```

Te imprime `ANON_KEY=...` y `SERVICE_ROLE_KEY=...` listos para pegar.

**3.3 Editar `~/supabase/docker/.env`** con un editor (`nano .env`) y completar como mínimo:

```bash
POSTGRES_PASSWORD=<el que generaste>
JWT_SECRET=<el que generaste>
ANON_KEY=<el que generó el script>
SERVICE_ROLE_KEY=<el que generó el script>

SITE_URL=https://HOSTNAME
API_EXTERNAL_URL=https://HOSTNAME:8443
SUPABASE_PUBLIC_URL=https://HOSTNAME:8443

DASHBOARD_USERNAME=<usuario para entrar a Supabase Studio>
DASHBOARD_PASSWORD=<contraseña fuerte para Studio>
```

**No necesitas** configurar SMTP en este `.env` de Supabase — la app maneja sus propios correos con Nodemailer/IONOS (`notificar()`), y el registro de usuarios usa `email_confirm: true` sin pasar por el flujo de confirmación por correo de Supabase Auth.

**3.4 Levantar Supabase:**

```bash
cd ~/supabase/docker
docker compose pull
docker compose up -d
docker compose ps   # todos los servicios deben quedar "Up" / "healthy"
```

**3.5 Configurar Caddy para exponer Supabase** con HTTPS automático, en el puerto `8443` (mismo hostname que el frontend, puerto distinto — ver nota de arquitectura al inicio). Edita `/etc/caddy/Caddyfile`:

```
HOSTNAME:8443 {
    reverse_proxy localhost:8000
}
```

(Kong, el gateway de Supabase, escucha en el puerto `8000` por defecto en el docker-compose oficial — verifica con `docker compose ps` que sea ese puerto. Caddy emite el certificado para `HOSTNAME` igual aunque lo sirva en un puerto no estándar — el desafío ACME usa el puerto 80, que ya dejaste abierto en el firewall.)

Recarga Caddy:

```bash
sudo systemctl reload caddy
```

Verifica: `https://HOSTNAME:8443` debería responder algo de Kong (no necesariamente una página bonita, pero no un error de conexión).

---

## Fase 4 — Clonar tu proyecto y preparar la base de datos

**4.1 Clonar tu repo:**

```bash
cd ~
git clone <URL_DE_TU_REPO_no-pierdas-el-viaje>
cd no-pierdas-el-viaje
```

**4.2 Backend — instalar dependencias:**

```bash
cd backend
npm install
```

**4.3 Crear `backend/.env` de producción:**

```bash
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://HOSTNAME

# El puerto de Postgres del docker-compose de Supabase (revisa POSTGRES_PORT en
# su .env, por defecto suele ser 5432 dentro de la red de Docker, expuesto en
# el host según cómo esté mapeado — confírmalo con `docker compose ps`)
DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@localhost:5432/postgres

SUPABASE_URL=https://HOSTNAME:8443
SUPABASE_ANON_KEY=<el ANON_KEY que generaste>
SUPABASE_SERVICE_ROLE_KEY=<el SERVICE_ROLE_KEY que generaste>

SMTP_HOST=smtp.ionos.com
SMTP_PORT=587
SMTP_USER=notificacionsac@sedmagdalena.info
SMTP_PASS=<la clave real>
SMTP_FROM=notificacionsac@sedmagdalena.info
SMTP_FROM_NAME=Notificaciones SAC SED Magdalena
```

**Importante — `CORS_ORIGIN`**: tiene que ser la URL real del frontend en producción. Los botones de los correos (`URL_LOGIN` en `emailTemplate.ts`) se arman a partir de esta variable — si queda mal, los links de "Iniciar sesión" en los correos van a apuntar a donde no es.

**4.4 Aplicar el schema** (con `migrate deploy`, no `migrate dev` — este comando no usa shadow DB, así que no hace falta ningún workaround manual, aplica todo el historial de migraciones tal cual, incluidas las de RLS y el trigger de storage):

```bash
npx prisma migrate deploy
npx prisma generate
```

**4.5 Activar RLS en la tabla interna de Prisma** (no la cubre ninguna migración — paso manual obligatorio en cada entorno nuevo, ver `backend/README.md`):

```bash
npx prisma db execute --sql 'ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;'
```

**4.6 Cargar los datos base:**

```bash
npm run prisma:seed          # catálogo de 25 tipos de documento
npm run importar:geografia   # departamentos/ciudades (DIVIPOLA)
```

**4.7 Crear el bucket de Storage a mano.** A diferencia de local (donde `supabase:start` lo crea solo por el `config.toml`), acá hay que crearlo manualmente:

1. Entra a `https://HOSTNAME:8443` — es Kong, te va a pedir las credenciales de `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD` que pusiste en el paso 3.3 (o entra directo a Studio si está expuesto en otro puerto/ruta — revisa el docker-compose).
2. Storage → New bucket → nombre exacto **`documentos-docentes`**, **privado** (sin marcar "Public").

**4.8 Crear el Super Usuario real de producción:**

```bash
npm run crear:super-usuario -- <cedula> <nombres> <apellidos> <email> <password>
```

Esta es una cuenta NUEVA — no es la misma que usas en local.

---

## Fase 5 — Backend en producción

```bash
cd ~/no-pierdas-el-viaje/backend
npm run build
pm2 start dist/index.js --name backend
pm2 save
```

Verifica localmente en el VPS (no hace falta exponerlo, solo debe responder en `localhost`):

```bash
curl http://localhost:4000/health
```

---

## Fase 6 — Frontend en producción

**6.1 Instalar dependencias** (en la raíz del repo, no en `backend/`):

```bash
cd ~/no-pierdas-el-viaje
npm install
```

**6.2 Crear `.env` de producción** en la raíz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://HOSTNAME:8443
NEXT_PUBLIC_SUPABASE_ANON_KEY=<el ANON_KEY que generaste>
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<tu site key de Turnstile>
```

**6.3 Build y arranque:**

```bash
npm run build
pm2 start npm --name frontend -- start
pm2 save
pm2 startup   # imprime un comando `sudo env PATH=... pm2 startup systemd -u ...` — cópialo y ejecútalo para que pm2 sobreviva a un reinicio del VPS
```

---

## Fase 7 — Exponer el frontend con Caddy

Agrega al mismo `/etc/caddy/Caddyfile` del paso 3.5 (queda un bloque por cada puerto, mismo hostname):

```
HOSTNAME {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl reload caddy
```

---

## Fase 8 — Ajustes finales específicos de este proyecto

- [ ] **Cloudflare Turnstile**: agrega `HOSTNAME` (sin el puerto, Turnstile valida por hostname) a la lista de dominios permitidos de tu sitekey en el dashboard de Cloudflare — si no, el widget no renderiza en producción (mismo problema que ya viste al probar por LAN con la IP local).
- [ ] **Supabase Auth `additional_redirect_urls`**: si en algún momento reactivan algún flujo de redirect (hoy no debería hacer falta, el flujo de "olvidé mi contraseña" se eliminó a propósito), hay que agregar `https://HOSTNAME/...` a la config de Auth en el `.env` del docker-compose de Supabase (`ADDITIONAL_REDIRECT_URLS`).
- [ ] **Probar el flujo completo en vivo**: registro de un docente de prueba → llega el correo de bienvenida con el link correcto → login → completar información adicional → subir autorización → como SAC, aprobarla → sigue subiendo el resto → como Talento Humano, aprobar documentos → como Gestor Documental, verificar que solo vea al que tiene todo aprobado. Bórralo todo al terminar (mismo criterio que usamos en local).

---

## Fase 9 — Operación día a día

**Actualizar el código tras un cambio:**

```bash
cd ~/no-pierdas-el-viaje
git pull

cd backend && npm install && npx prisma migrate deploy && npm run build && pm2 restart backend

cd .. && npm install && npm run build && pm2 restart frontend
```

**Ver logs:**

```bash
pm2 logs backend
pm2 logs frontend
docker compose -f ~/supabase/docker/docker-compose.yml logs -f
```

**Backup de la base de datos** (cron diario recomendado):

```bash
docker exec supabase-db pg_dump -U postgres postgres > ~/backups/backup-$(date +%Y%m%d).sql
```

(el nombre exacto del contenedor puede variar — confírmalo con `docker compose ps` dentro de `~/supabase/docker`)

---

## Resumen de lo que necesitas tener a mano antes de arrancar

1. IP del VPS + credenciales SSH.
2. El hostname que te dio Hostinger (hPanel → VPS → Overview) — no hace falta ningún dominio propio.
3. Las credenciales SMTP de IONOS (ya las tienes).
4. El site key/secret de Turnstile (ya las tienes).
