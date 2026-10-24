const mysql = require("mysql2/promise");

/**
 * Construye la configuracion del pool desde variables de entorno.
 * Las credenciales no tienen valores por defecto: se inyectan desde
 * Docker Compose (.env) o desde un Secret de Kubernetes.
 */
function configDesdeEntorno(env = process.env) {
  const faltantes = ["DB_USER", "DB_PASSWORD"].filter((k) => !env[k]);
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno obligatorias: ${faltantes.join(", ")}`);
  }

  return {
    host: env.DB_HOST || "tienda-db",
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME || "tienda_perritos",
    port: Number(env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: Number(env.DB_POOL_SIZE || 10),
    queueLimit: 0,
  };
}

function createPool(env = process.env) {
  return mysql.createPool(configDesdeEntorno(env));
}

module.exports = { configDesdeEntorno, createPool };
