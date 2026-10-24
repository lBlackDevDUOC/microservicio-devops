const { validarProducto, parsearId } = require("../src/validators");

const valido = { nombre: "Alimento Cachorro", descripcion: "Pollo", precio: 19990, stock: 10 };

describe("validarProducto", () => {
  test("acepta un producto valido", () => {
    expect(validarProducto(valido)).toBeNull();
  });

  test("acepta descripcion ausente y stock en cero", () => {
    expect(validarProducto({ nombre: "Snack", precio: 0, stock: 0 })).toBeNull();
  });

  test.each([
    [undefined, "objeto JSON"],
    ["texto", "objeto JSON"],
    [{ ...valido, nombre: "" }, "obligatorios"],
    [{ ...valido, nombre: "   " }, "obligatorios"],
    [{ ...valido, nombre: 123 }, "obligatorios"],
    [{ ...valido, precio: undefined }, "obligatorios"],
    [{ ...valido, stock: null }, "obligatorios"],
    [{ ...valido, nombre: "x".repeat(101) }, "100 caracteres"],
    [{ ...valido, descripcion: 5 }, "255 caracteres"],
    [{ ...valido, descripcion: "x".repeat(256) }, "255 caracteres"],
    [{ ...valido, precio: -1 }, "precio"],
    [{ ...valido, precio: "100" }, "precio"],
    [{ ...valido, precio: Infinity }, "precio"],
    [{ ...valido, stock: -5 }, "stock"],
    [{ ...valido, stock: 1.5 }, "stock"],
  ])("rechaza %p", (body, fragmento) => {
    expect(validarProducto(body)).toContain(fragmento);
  });
});

describe("parsearId", () => {
  test("convierte ids enteros positivos", () => {
    expect(parsearId("7")).toBe(7);
  });

  test.each(["0", "-3", "abc", "1.5", ""])("rechaza %p", (valor) => {
    expect(parsearId(valor)).toBeNull();
  });
});
