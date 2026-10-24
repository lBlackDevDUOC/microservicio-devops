/**
 * Reglas de negocio para validar productos antes de persistirlos.
 * Devuelve un mensaje de error o null si el producto es valido.
 */
function validarProducto(body) {
  if (!body || typeof body !== "object") {
    return "El cuerpo de la solicitud debe ser un objeto JSON.";
  }

  const { nombre, descripcion, precio, stock } = body;

  if (typeof nombre !== "string" || nombre.trim() === "" || precio == null || stock == null) {
    return "Nombre, precio y stock son obligatorios.";
  }
  if (nombre.trim().length > 100) {
    return "El nombre no puede superar los 100 caracteres.";
  }
  if (descripcion != null && (typeof descripcion !== "string" || descripcion.length > 255)) {
    return "La descripcion debe ser texto de hasta 255 caracteres.";
  }
  if (typeof precio !== "number" || !Number.isFinite(precio) || precio < 0) {
    return "El precio debe ser un numero mayor o igual a 0.";
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return "El stock debe ser un entero mayor o igual a 0.";
  }
  return null;
}

/**
 * Valida que el id de la ruta sea un entero positivo.
 */
function parsearId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

module.exports = { validarProducto, parsearId };
