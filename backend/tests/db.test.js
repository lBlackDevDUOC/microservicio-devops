const { configDesdeEntorno, createPool } = require("../src/db");

describe("configDesdeEntorno", () => {
  test("usa las variables de entorno entregadas", () => {
    const config = configDesdeEntorno({
      DB_HOST: "mysql",
      DB_USER: "alumno",
      DB_PASSWORD: "secreto",
      DB_NAME: "tienda",
      DB_PORT: "3307",
      DB_POOL_SIZE: "5",
    });
    expect(config).toMatchObject({
      host: "mysql",
      user: "alumno",
      password: "secreto",
      database: "tienda",
      port: 3307,
      connectionLimit: 5,
    });
  });

  test("aplica valores por defecto no sensibles", () => {
    const config = configDesdeEntorno({ DB_USER: "alumno", DB_PASSWORD: "secreto" });
    expect(config).toMatchObject({ host: "tienda-db", database: "tienda_perritos", port: 3306, connectionLimit: 10 });
  });

  test("falla si faltan credenciales (no hay contrasenas por defecto)", () => {
    expect(() => configDesdeEntorno({ DB_USER: "alumno" })).toThrow(/DB_PASSWORD/);
    expect(() => configDesdeEntorno({})).toThrow(/DB_USER, DB_PASSWORD/);
  });
});

describe("createPool", () => {
  test("crea un pool sin abrir conexiones hasta la primera consulta", async () => {
    const pool = createPool({ DB_USER: "alumno", DB_PASSWORD: "secreto" });
    expect(typeof pool.query).toBe("function");
    await pool.end();
  });
});
