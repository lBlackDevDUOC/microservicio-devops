# Imagen oficial MySQL 8.4 LTS con el esquema y datos iniciales de la tienda.
# Las credenciales NO se guardan en la imagen: se inyectan en tiempo de ejecucion
# (archivo .env en Docker Compose o Secret en Kubernetes).
FROM mysql:8.4

ARG VCS_REF=unknown
LABEL org.opencontainers.image.title="tienda-db" \
      org.opencontainers.image.revision="${VCS_REF}"

# Se ejecuta automaticamente la primera vez que se inicializa el volumen de datos
COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 3306

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=10 \
  CMD mysqladmin ping -h 127.0.0.1 --silent || exit 1
