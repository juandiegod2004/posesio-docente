# syntax=docker/dockerfile:1

# Node parchado: aviso oficial de Node.js del 2026-10-21 (22.23.4 / 24.22.1 / 26.12.1).
# Nixpacks (EasyPanel) no llega a esa versión; construir con este Dockerfile sí. Slim (Debian) y no
# alpine por Prisma/openssl. Para subir de versión solo se cambia este ARG.
ARG NODE_VERSION=24.22.1

# ---------- build: dependencias completas, cliente de Prisma y compilación TypeScript ----------
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate && npm run build

# ---------- runtime: solo lo necesario para correr y para operar desde la terminal de EasyPanel ----------
FROM node:${NODE_VERSION}-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# tsx (en la MISMA versión del lockfile): desde la terminal del servicio se corren `npm run prisma:seed`,
# `npm run importar:geografia` y `npm run crear:super-usuario` (el firewall ya no deja hacerlo desde un equipo
# externo), y todos usan tsx. La CLI de Prisma (`npx prisma migrate deploy`) ya viene con las dependencias de
# producción. tsx va en /opt/ops y no junto a ellas: con NODE_ENV=production npm lo descarta al mezclarlas
# (probado). Se enlaza en node_modules/.bin para que `npx` y los scripts de package.json lo encuentren.
RUN mkdir /opt/ops && cd /opt/ops && npm init -y >/dev/null \
 && npm install --no-audit --no-fund \
      "tsx@$(node -p "require('/app/package-lock.json').packages['node_modules/tsx'].version")" \
 && npm cache clean --force \
 && ln -s /opt/ops/node_modules/.bin/tsx /app/node_modules/.bin/tsx

# Cliente de Prisma ya generado (con su motor binario) y el JS compilado.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist

# El código fuente, prisma/ y scripts/ hacen falta en tiempo de ejecución: el logo del correo se lee de
# src/assets (relativo al cwd), y los scripts de operación usan el alias @/ de tsconfig y prisma/data.
COPY tsconfig.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src
# COPY conserva los permisos del equipo de origen (el logo del correo llega con 600 y root como dueño) y el
# proceso corre como `node`: sin esto no podría leerlo y los correos fallarían (comprobado).
RUN chmod -R a+rX /app/src /app/prisma /app/scripts /app/tsconfig.json /app/dist

USER node

# El puerto lo define la variable PORT (EasyPanel la inyecta; por defecto 4000). Mismas variables de
# entorno que hoy: se leen del servicio en EasyPanel, no van dentro de la imagen.
EXPOSE 4000
CMD ["node", "dist/index.js"]
