const request = require("supertest");
const { createApp } = require("../src/app");

const producto = { id: 1, nombre: "Alimento Cachorro", descripcion: "Pollo", precio: 19990, stock: 10 };
const body = { nombre: "Alimento Cachorro", descripcion: "Pollo", precio: 19990, stock: 10 };

// Doble de prueba del pool de MySQL: cada test define las respuestas de query()
function crearApp() {
  const pool = { query: jest.fn() };
  const app = createApp({ pool, version: "test-sha" });
  return { app, pool };
}

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("health y readiness", () => {
  test("GET /api/health responde ok con la version desplegada", async () => {
    const { app } = crearApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", version: "test-sha" });
  });

  test("GET /api/ready responde 200 cuando la base de datos responde", async () => {
    const { app, pool } = crearApp();
    pool.query.mockResolvedValue([[{ 1: 1 }]]);
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(200);
    expect(res.body.database).toBe("up");
  });

  test("GET /api/ready responde 503 cuando la base de datos no esta disponible", async () => {
    const { app, pool } = crearApp();
    pool.query.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await request(app).get("/api/ready");
    expect(res.status).toBe(503);
    expect(res.body.database).toBe("down");
  });

  test("no expone la cabecera x-powered-by", async () => {
    const { app } = crearApp();
    const res = await request(app).get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("GET /api/productos", () => {
  test("lista los productos", async () => {
    const { app, pool } = crearApp();
    pool.query.mockResolvedValue([[producto]]);
    const res = await request(app).get("/api/productos");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([producto]);
  });

  test("responde 500 si falla la consulta", async () => {
    const { app, pool } = crearApp();
    pool.query.mockRejectedValue(new Error("db caida"));
    const res = await request(app).get("/api/productos");
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/No se pudieron obtener/);
  });
});

describe("GET /api/productos/:id", () => {
  test("devuelve el producto", async () => {
    const { app, pool } = crearApp();
    pool.query.mockResolvedValue([[producto]]);
    const res = await request(app).get("/api/productos/1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(producto);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("WHERE id = ?"), [1]);
  });

  test("responde 404 si no existe", async () => {
    const { app, pool } = crearApp();
    pool.query.mockResolvedValue([[]]);
    const res = await request(app).get("/api/productos/99");
    expect(res.status).toBe(404);
  });

  test("responde 400 con un id invalido sin consultar la base de datos", async () => {
    const { app, pool } = crearApp();
    const res = await request(app).get("/api/productos/abc");
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("responde 500 si falla la consulta", async () => {
    const { app, pool } = crearApp();
    pool.query.mockRejectedValue(new Error("db caida"));
    const res = await request(app).get("/api/productos/1");
    expect(res.status).toBe(500);
  });
});

describe("POST /api/productos", () => {
  test("crea el producto y responde 201", async () => {
    const { app, pool } = crearApp();
    pool.query.mockResolvedValueOnce([{ insertId: 1 }]).mockResolvedValueOnce([[producto]]);
    const res = await request(app).post("/api/productos").send(body);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(producto);
    expect(pool.query.mock.calls[0][1]).toEqual(["Alimento Cachorro", "Pollo", 19990, 10]);
  });

  test("guarda descripcion null cuando no se envia", async () => {
    const { app, pool } = crearApp();
    pool.query.mockResolvedValueOnce([{ insertId: 2 }]).mockResolvedValueOnce([[producto]]);
    await request(app).post("/api/productos").send({ nombre: "Snack", precio: 5990, stock: 3 });
    expect(pool.query.mock.calls[0][1]).toEqual(["Snack", null, 5990, 3]);
  });

  test("rechaza stock negativo sin tocar la base de datos", async () => {
    const { app, pool } = crearApp();
    const res = await request(app).post("/api/productos").send({ ...body, stock: -1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/stock/);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("rechaza campos obligatorios faltantes", async () => {
    const { app } = crearApp();
    const res = await request(app).post("/api/productos").send({ nombre: "Sin precio" });
    expect(res.status).toBe(400);
  });

  test("responde 400 ante JSON mal formado", async () => {
    const { app } = crearApp();
    const res = await request(app)
      .post("/api/productos")
      .set("Content-Type", "application/json")
      .send("{nombre:");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("JSON mal formado.");
  });

  test("responde 500 si falla la insercion", async () => {
    const { app, pool } = crearApp();
    pool.query.mockRejectedValue(new Error("db caida"));
    const res = await request(app).post("/api/productos").send(body);
    expect(res.status).toBe(500);
  });
});

describe("PUT /api/productos/:id", () => {
  test("actualiza el producto", async () => {
    const { app, pool } = crearApp();
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[producto]]);
    const res = await request(app).put("/api/productos/1").send(body);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(producto);
  });

  test("responde 404 si el producto no existe", async () => {
    const { app, pool } = crearApp();
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put("/api/productos/99").send(body);
    expect(res.status).toBe(404);
  });

  test("rechaza datos invalidos", async () => {
    const { app, pool } = crearApp();
    const res = await request(app).put("/api/productos/1").send({ ...body, precio: -10 });
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("rechaza id invalido", async () => {
    const { app } = crearApp();
    const res = await request(app).put("/api/productos/0").send(body);
    expect(res.status).toBe(400);
  });

  test("responde 500 si falla la actualizacion", async () => {
    const { app, pool } = crearApp();
    pool.query.mockRejectedValue(new Error("db caida"));
    const res = await request(app).put("/api/productos/1").send(body);
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/productos/:id", () => {
  test("elimina el producto", async () => {
    const { app, pool } = crearApp();
    pool.query.mockResolvedValue([{ affectedRows: 1 }]);
    const res = await request(app).delete("/api/productos/1");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/eliminado/);
  });

  test("responde 404 si el producto no existe", async () => {
    const { app, pool } = crearApp();
    pool.query.mockResolvedValue([{ affectedRows: 0 }]);
    const res = await request(app).delete("/api/productos/99");
    expect(res.status).toBe(404);
  });

  test("responde 500 si falla la eliminacion", async () => {
    const { app, pool } = crearApp();
    pool.query.mockRejectedValue(new Error("db caida"));
    const res = await request(app).delete("/api/productos/1");
    expect(res.status).toBe(500);
  });
});

describe("CORS", () => {
  test("no expone cabeceras CORS si no hay origen configurado", async () => {
    const { app } = crearApp();
    const res = await request(app).get("/api/health").set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("permite solo los origenes configurados", async () => {
    const app = createApp({ pool: { query: jest.fn() }, corsOrigin: "https://tienda.example, https://admin.example" });
    const permitido = await request(app).get("/api/health").set("Origin", "https://admin.example");
    expect(permitido.headers["access-control-allow-origin"]).toBe("https://admin.example");
    const rechazado = await request(app).get("/api/health").set("Origin", "https://evil.example");
    expect(rechazado.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("rutas desconocidas", () => {
  test("responde 404 en JSON", async () => {
    const { app } = crearApp();
    const res = await request(app).get("/api/no-existe");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Recurso no encontrado.");
  });
});
