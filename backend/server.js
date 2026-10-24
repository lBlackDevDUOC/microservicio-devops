const { createApp } = require("./src/app");
const { createPool } = require("./src/db");

const PORT = Number(process.env.PORT || 3001);

const pool = createPool();
const app = createApp({ pool });

const server = app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});

// Apagado ordenado: Docker y Kubernetes envian SIGTERM antes de detener el contenedor
function apagar(signal) {
  console.log(`${signal} recibido, cerrando servidor...`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => apagar("SIGTERM"));
process.on("SIGINT", () => apagar("SIGINT"));
