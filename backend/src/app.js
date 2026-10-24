const express = require("express");
const cors = require("cors");
const { validarProducto, parsearId } = require("./validators");

const COLUMNAS = "id, nombre, descripcion, precio, stock";

/**
 * Crea la aplicacion Express. El pool de MySQL se inyecta para poder
 * reemplazarlo por un doble de prueba en los tests unitarios.
 */
function createApp({ pool, version = process.env.APP_VERSION || "dev" }) {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  // Helper para manejar errores
  function handleError(res, error, message = "Error interno del servidor") {
    console.error(error);
    res.status(500).json({ message });
  }

  // Middleware que valida el parametro :id de las rutas
  function conId(req, res, next) {
    const id = parsearId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "El id debe ser un entero positivo." });
    }
    req.productoId = id;
    next();
  }

  // Liveness: el proceso esta vivo
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Backend de tienda de perritos en ejecución.",
      version,
    });
  });

  // Readiness: el servicio puede atender trafico (base de datos disponible)
  app.get("/api/ready", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.status(200).json({ status: "ready", database: "up" });
    } catch (err) {
      console.error(err);
      res.status(503).json({ status: "not-ready", database: "down" });
    }
  });

  // Obtener todos los productos
  app.get("/api/productos", async (req, res) => {
    try {
      const [rows] = await pool.query(`SELECT ${COLUMNAS} FROM productos ORDER BY id DESC`);
      res.json(rows);
    } catch (err) {
      handleError(res, err, "No se pudieron obtener los productos.");
    }
  });

  // Obtener un producto por ID
  app.get("/api/productos/:id", conId, async (req, res) => {
    try {
      const [rows] = await pool.query(`SELECT ${COLUMNAS} FROM productos WHERE id = ?`, [req.productoId]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "Producto no encontrado." });
      }
      res.json(rows[0]);
    } catch (err) {
      handleError(res, err, "No se pudo obtener el producto.");
    }
  });

  // Crear un nuevo producto
  app.post("/api/productos", async (req, res) => {
    const error = validarProducto(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const { nombre, descripcion, precio, stock } = req.body;
    try {
      const [result] = await pool.query(
        "INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)",
        [nombre.trim(), descripcion || null, precio, stock]
      );
      const [rows] = await pool.query(`SELECT ${COLUMNAS} FROM productos WHERE id = ?`, [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) {
      handleError(res, err, "No se pudo crear el Producto.");
    }
  });

  // Actualizar un producto
  app.put("/api/productos/:id", conId, async (req, res) => {
    const error = validarProducto(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const { nombre, descripcion, precio, stock } = req.body;
    try {
      const [result] = await pool.query(
        "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?",
        [nombre.trim(), descripcion || null, precio, stock, req.productoId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Producto no encontrado." });
      }
      const [rows] = await pool.query(`SELECT ${COLUMNAS} FROM productos WHERE id = ?`, [req.productoId]);
      res.json(rows[0]);
    } catch (err) {
      handleError(res, err, "No se pudo actualizar el Producto.");
    }
  });

  // Eliminar un producto
  app.delete("/api/productos/:id", conId, async (req, res) => {
    try {
      const [result] = await pool.query("DELETE FROM productos WHERE id = ?", [req.productoId]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Producto no encontrado." });
      }
      res.json({ message: "Producto eliminado correctamente." });
    } catch (err) {
      handleError(res, err, "No se pudo eliminar el Producto.");
    }
  });

  // Ruta no encontrada
  app.use((req, res) => {
    res.status(404).json({ message: "Recurso no encontrado." });
  });

  // JSON mal formado u otros errores no controlados
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ message: "JSON mal formado." });
    }
    handleError(res, err);
  });

  return app;
}

module.exports = { createApp };
