# syntax=docker/dockerfile:1

# Frontend de Posesión Docente (Next.js). Imagen basada en Node parchado (aviso de seguridad de
# Node.js del 21-oct-2026: 22.23.4 / 24.22.1 / 26.12.1). Nixpacks 1.41.0 solo llega a 24.21.0,
# por eso el despliegue pasa de Nixpacks a este Dockerfile.
#
# VARIABLES NEXT_PUBLIC_*: Next las incrusta en el bundle al compilar y next.config.ts también
# arma el CSP y los rewrites a /api con ellas, así que hay que darlas EN EL BUILD, no solo al correr.
# En EasyPanel: App > Build > método "Dockerfile" y agregar las 4 como Build Args (mismo nombre y
# valor que hoy en Environment). Si faltan en el build, el sitio sale apuntando a localhost.
# Build local de ejemplo:
#   docker build -t posesion-frontend \
#     --build-arg NEXT_PUBLIC_API_URL=... --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=... .
#
# Ninguna clave privada entra a la imagen: las NEXT_PUBLIC_* son públicas por diseño (van en el
# navegador) y .dockerignore deja fuera .env*. El secret de Turnstile vive solo en Supabase Auth.

ARG NODE_IMAGE=node:24.22.1-slim

# ---------- deps: todas las dependencias (para compilar) ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- prod-deps: solo dependencias de producción (para la imagen final) ----------
FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- builder ----------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runner ----------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

# Mismos valores también en runtime: next start vuelve a cargar next.config.ts (CSP y rewrites).
# EasyPanel los sobrescribe con su Environment si se definen allí.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/package.json /app/next.config.ts /app/tsconfig.json ./

# Usuario no root (el usuario "node" ya viene en la imagen oficial).
USER node
EXPOSE 3000

# Igual que hoy: "npm start" = "next start" en el puerto 3000.
CMD ["npm", "start"]
