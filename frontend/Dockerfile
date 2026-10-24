# syntax=docker/dockerfile:1

# Nginx sin privilegios: corre como usuario nginx (uid 101) y escucha en el puerto 8080
FROM nginxinc/nginx-unprivileged:1.27-alpine

ARG APP_VERSION=dev
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="tienda-frontend" \
      org.opencontainers.image.description="Frontend web de la tienda de alimentos para perritos" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}"

# URL del backend: se resuelve al iniciar el contenedor (Docker Compose o Service de Kubernetes)
ENV BACKEND_URL=http://tienda-backend:3001

# La imagen oficial procesa /etc/nginx/templates/*.template con envsubst al arrancar
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --chown=nginx:nginx index.html app.js /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
