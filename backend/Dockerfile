# syntax=docker/dockerfile:1

# Imagen base compartida por todas las etapas (version fijada para builds reproducibles)
ARG NODE_IMAGE=node:24-alpine

# ---------- Etapa 1: dependencias de produccion ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ---------- Etapa 2: pruebas (docker build --target test .) ----------
FROM ${NODE_IMAGE} AS test
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run lint && npm run test:ci

# ---------- Etapa 3: imagen final de ejecucion ----------
FROM ${NODE_IMAGE} AS runtime

ARG APP_VERSION=dev
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="tienda-backend" \
      org.opencontainers.image.description="API REST de la tienda de alimentos para perritos" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}"

ENV NODE_ENV=production \
    PORT=3001 \
    APP_VERSION=${APP_VERSION}

WORKDIR /app

# En ejecucion solo se necesita "node": se eliminan los gestores de paquetes
# (npm, npx, corepack, yarn) para reducir la superficie de ataque y el tamano
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

# Solo se copian las dependencias de produccion y el codigo fuente, con un usuario sin privilegios
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node src ./src

USER node
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
