# Ecclesia Sistema Nacional de Gestión de Iglesias

Proyecto individual para el caso **Coordinación Nacional de Templos**. Stack: Express sobre Node.js, PostgreSQL, Zod, Vitest/Supertest. Herramienta de IA principal declarada desde esta entrega: **Codex**. El autor revisa las salidas; las decisiones y errores reales se registran en `docs/bitacora-ia.md`.

El antiguo portal de una iglesia y el Site de demostración son referencias visuales, no constituyen la API ni la base de datos de este proyecto.

## Arranque de desarrollo

1. Copiar `.env.example` a `.env` y sustituir `JWT_SECRET` por un secreto propio.
2. Levantar PostgreSQL con `docker compose up -d db` (Docker Desktop debe estar iniciado). Si el equipo no tiene Docker, ejecutar `npm run db:embedded` en otra terminal y cambiar `DATABASE_URL` en `.env` a `postgres://postgres:postgres@127.0.0.1:5433/postgres`.
3. Ejecutar `npm ci`, `npm run db:migrate` y `npm run db:seed`.
4. Ejecutar `npm run dev`; la interfaz pública queda en `http://localhost:4300/` y la API en `http://localhost:4300/api/v1`. El contrato está en `/openapi.yaml`.
5. Ejecutar `npm run check` antes de cada commit y `npm run test:integration` con la base levantada.

El catálogo geográfico se importará desde el [servicio oficial de INEGI](https://www.inegi.org.mx/servicios/catalogounico/). La versión/corte debe quedar registrada en el seed. Los datos de prueba personales son ficticios.

La base embebida usa PostgreSQL en WASM para desarrollo local. Los datos persisten en `data/pglite-db/`, excluido de Git. Se debe repetir la validación final sobre un servidor PostgreSQL normal.

## Usuarios de demostración local

Estos usuarios son ficticios y se crean solo con `npm run db:seed` fuera de producción. El acceso del personal está en `http://localhost:4300/gestion.html`.

| Rol | Correo | Contraseña de demostración |
|---|---|---|
| Coordinación | `coordinacion@ecclesia.test` | `CoordDemo123!` |
| Administración | `administrador@ecclesia.test` | `AdminDemo123!` |
| Tesorería | `tesorero@ecclesia.test` | `TesoroDemo123!` |

## Documentación

- `plan.md`: secuencia y entregas.
- `docs/requerimientos.md`: RF, RNF, RN, criterios, glosario y preguntas.
- `docs/trazabilidad.md`: evidencia por requisito.
- `docs/ARCHITECTURE.md` y `docs/adr/`: decisiones técnicas.
- `openapi.yaml`: contrato HTTP.
- `docs/bitacora-ia.md`: uso honesto de Codex.
- `docs/defensa.md`: guion de 20 minutos, demostración y evidencia pendiente.

El arnés reutilizable está en el repositorio hermano `ecclesia-arnes`, separado del producto.
