#!/usr/bin/env bash
# Pruebas de humo post-despliegue. Se ejecutan contra el entorno recien desplegado
# (Docker Compose o Kubernetes) a traves del frontend, igual que un usuario real.
#
# Uso: scripts/smoke-test.sh <url-base> [version-esperada]
set -euo pipefail

BASE_URL="${1:?Uso: smoke-test.sh <url-base> [version-esperada]}"
EXPECTED_VERSION="${2:-}"
FALLOS=0

ok()   { echo "  [OK]   $1"; }
fail() { echo "  [FAIL] $1"; FALLOS=$((FALLOS + 1)); }

# Espera hasta 60 s a que el punto de entrada responda
for _ in $(seq 1 30); do
  curl -fs "$BASE_URL/healthz" >/dev/null 2>&1 && break
  sleep 2
done

echo "Smoke tests contra $BASE_URL"

# 1. Frontend disponible
if curl -fs "$BASE_URL/" | grep -q "Tienda de Alimentos"; then ok "frontend sirve index.html"; else fail "frontend no responde"; fi

# 2. Backend vivo y con la version desplegada (trazabilidad commit -> entorno)
HEALTH=$(curl -fs "$BASE_URL/api/health" || echo '{}')
if echo "$HEALTH" | grep -q '"status":"ok"'; then ok "backend /api/health"; else fail "backend /api/health -> $HEALTH"; fi
if [ -n "$EXPECTED_VERSION" ]; then
  if echo "$HEALTH" | grep -q "\"version\":\"$EXPECTED_VERSION\""; then
    ok "version desplegada = $EXPECTED_VERSION"
  else
    fail "version esperada $EXPECTED_VERSION, recibida: $HEALTH"
  fi
fi

# 3. Conectividad con la base de datos
if curl -fs "$BASE_URL/api/ready" | grep -q '"database":"up"'; then ok "backend conectado a MySQL"; else fail "backend sin conexion a MySQL"; fi

# 4. Lectura de datos iniciales
TOTAL=$(curl -fs "$BASE_URL/api/productos" | grep -o '"id":' | wc -l)
if [ "$TOTAL" -ge 1 ]; then ok "listado de productos ($TOTAL registros)"; else fail "listado de productos vacio"; fi

# 5. Ciclo CRUD completo
NUEVO=$(curl -fs -X POST "$BASE_URL/api/productos" -H "Content-Type: application/json" \
  -d '{"nombre":"Smoke test","descripcion":"Producto temporal del pipeline","precio":1000,"stock":1}' || echo '{}')
ID=$(echo "$NUEVO" | sed -n 's/.*"id":\([0-9]*\).*/\1/p')
if [ -n "$ID" ]; then
  ok "POST crea producto #$ID"
  if curl -fs "$BASE_URL/api/productos/$ID" | grep -q "Smoke test"; then ok "GET producto #$ID"; else fail "GET producto #$ID"; fi
  if curl -fs -X DELETE "$BASE_URL/api/productos/$ID" >/dev/null; then ok "DELETE producto #$ID"; else fail "DELETE producto #$ID"; fi
else
  fail "POST no creo el producto -> $NUEVO"
fi

# 6. Regla de negocio: stock negativo debe rechazarse
CODIGO=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/productos" \
  -H "Content-Type: application/json" -d '{"nombre":"Invalido","precio":10,"stock":-1}')
if [ "$CODIGO" = "400" ]; then ok "validacion de stock negativo (400)"; else fail "stock negativo devolvio $CODIGO"; fi

# 7. Cabeceras de seguridad del frontend
if curl -fsI "$BASE_URL/" | grep -qi "x-content-type-options: nosniff"; then ok "cabeceras de seguridad"; else fail "faltan cabeceras de seguridad"; fi

if [ "$FALLOS" -gt 0 ]; then
  echo "Smoke tests: $FALLOS fallo(s)"
  exit 1
fi
echo "Smoke tests: todos OK"
