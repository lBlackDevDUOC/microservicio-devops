# tienda-perritos

Microservicio para administrar el catalogo de una tienda de alimentos para perritos. El proyecto separa un backend Node.js/Express, un frontend web, una base de datos MySQL y manifiestos Kubernetes para desplegar la solucion en un namespace dedicado.

## Componentes

- **Backend:** API REST en Node.js y Express para consultar, crear, actualizar y eliminar productos, con endpoint de salud en `/api/health`.
- **Frontend:** interfaz web que consume la API del backend.
- **Base de datos:** MySQL inicializado con el esquema y los datos definidos en `db/init.sql`.
- **Despliegue:** Dockerfiles por componente y recursos Kubernetes para deployments, services, secretos y autoscaling.
- **Integracion continua:** GitHub Actions valida la sintaxis del backend en cada cambio relevante.

## Estructura del proyecto

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── db/
│   ├── Dockerfile
│   └── init.sql
├── frontend/
│   ├── Dockerfile
│   ├── app.js
│   ├── default.conf
│   └── index.html
└── k8s/
    ├── backend-deployment.yaml
    ├── backend-hpa.yaml
    ├── backend-service.yaml
    ├── frontend-deployment.yaml
    ├── frontend-hpa.yaml
    ├── frontend-service.yaml
    ├── mysql-deployment.yaml
    ├── mysql-secret.yaml
    ├── mysql-service.yaml
    ├── namespace.yaml
    └── README.txt
```

## Modelo de ramificacion GitFlow

Se eligio GitFlow porque separa el desarrollo en curso de las versiones estables y permite atender correcciones urgentes sin mezclar trabajo incompleto con produccion. Esta separacion es especialmente util en un proyecto con backend, frontend, base de datos y manifiestos de infraestructura.

- **`main`:** contiene el codigo estable que representa una version entregable o desplegable. Los cambios llegan mediante pull requests aprobados desde `develop` o desde una rama `hotfix`.
- **`develop`:** integra el trabajo terminado de las funcionalidades antes de preparar una entrega. Es la rama base para nuevas ramas `feature`.
- **`feature/nombre`:** contiene una funcionalidad o mejora aislada. Se crea desde `develop` y se integra de vuelta a `develop` mediante pull request.
- **`hotfix/nombre`:** contiene una correccion urgente sobre la version estable. Se crea desde `main` y, despues de validarse, se integra a `main` y tambien a `develop` para evitar que la correccion se pierda.

## Buenas practicas

### Convenciones de commits

Se utiliza [Conventional Commits](https://www.conventionalcommits.org/). El formato recomendado es:

```text
<tipo>(<alcance opcional>): <descripcion breve>
```

Tipos habituales:

- `feat`: agrega una funcionalidad.
- `fix`: corrige un error.
- `docs`: modifica documentacion.
- `refactor`: reorganiza codigo sin cambiar el comportamiento.
- `test`: agrega o modifica pruebas.
- `ci`: cambia automatizaciones de integracion continua.
- `chore`: realiza tareas de mantenimiento.

Ejemplos:

```text
feat(api): agrega consulta de producto por id
fix(db): corrige host predeterminado de MySQL
ci: valida sintaxis del backend con Node.js 20
docs: documenta el flujo GitFlow
```

Los commits deben ser pequenos, coherentes, escritos en imperativo y describir un solo objetivo.

### Naming de ramas

- Funcionalidades: `feature/nombre-descriptivo`
- Correcciones urgentes: `hotfix/nombre-descriptivo`
- Nombres en minusculas, sin espacios, usando guiones para separar palabras.

Ejemplos: `feature/filtro-productos` y `hotfix/validacion-stock`.

### Flujo de merge

1. Actualizar la rama base antes de comenzar.
2. Crear una rama `feature` o `hotfix` con un objetivo acotado.
3. Implementar el cambio y crear commits convencionales.
4. Hacer push de la rama y abrir un pull request.
5. Esperar la ejecucion correcta de CI y la revision requerida.
6. Hacer merge con la estrategia definida por el equipo, preferentemente **Squash and merge** para mantener un historial claro.
7. Eliminar la rama remota despues del merge y actualizar las ramas locales.

Las `feature` se integran en `develop`. Una `hotfix` se integra primero en `main` y luego se replica en `develop` mediante otro pull request.

### Revision de pull requests

- Usar un titulo claro siguiendo Conventional Commits.
- Explicar el problema, la solucion y la forma de verificarla.
- Mantener cada pull request pequeno y relacionado con un solo objetivo.
- Adjuntar capturas o ejemplos de API cuando el cambio afecte la interfaz o los endpoints.
- Exigir al menos una aprobacion de un integrante distinto del autor.
- No hacer merge con checks de CI fallidos o conflictos sin resolver.
- Revisar seguridad, manejo de errores, compatibilidad con Docker/Kubernetes y posibles efectos en la base de datos.
- Resolver todos los comentarios o documentar explicitamente por que se mantienen.

## Integracion continua

El workflow `.github/workflows/ci.yml` se ejecuta en pushes a `develop` y en pull requests dirigidos a `main`. Instala Node.js 20, entra en `backend`, ejecuta `npm install` y valida `server.js` con `node --check`.

## Ejecucion local

```bash
cd backend
npm install
node server.js
```

La API queda disponible por defecto en `http://localhost:3001`.

## Despliegue en Kubernetes

Los manifiestos se encuentran en `k8s/`. Para el procedimiento de despliegue y verificacion se puede consultar [`k8s/README.txt`](k8s/README.txt).

## Estado del proyecto

Este repositorio corresponde a una evaluacion academica de Ingenieria DevOps y sirve como demostracion de control de versiones, integracion continua, contenerizacion y despliegue orquestado.
