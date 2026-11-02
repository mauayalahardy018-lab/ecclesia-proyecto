# Ecclesia Sistema Nacional de Gestión de Iglesias

Proyecto individual para el caso **Coordinación Nacional de Templos**. Stack: Express sobre Node.js, PostgreSQL, Zod, Vitest/Supertest. Herramienta de IA principal declarada desde esta entrega: **Codex**. El autor revisa las salidas; las decisiones y errores reales se registran en `docs/bitacora-ia.md`.

El antiguo portal de una iglesia sirvió de referencia visual. La [demostración pública en Sites](https://ecclesia-demo-nacional-mexico.mauayalahardy018.chatgpt.site) muestra el directorio y el [panel integrado](https://ecclesia-demo-nacional-mexico.mauayalahardy018.chatgpt.site/#gestion) en un solo sitio. Sus cambios se guardan en cada navegador; la API y la base de datos de este proyecto son la implementación compartible.

## Arranque de desarrollo

1. Copiar `.env.example` a `.env` y sustituir `JWT_SECRET` por un secreto propio.
2. Levantar PostgreSQL con `docker compose up -d db` (Docker Desktop debe estar iniciado). Si el equipo no tiene Docker, ejecutar `npm run db:embedded` en otra terminal, cambiar `DATABASE_URL` en `.env` a `postgres://postgres:postgres@127.0.0.1:5433/postgres` y poner `DB_POOL_MAX=1`. El servidor embebido admite una conexión de esta aplicación a la vez; así se encolan las consultas paralelas de la ficha.
3. Ejecutar `npm ci`, `npm run db:migrate` y `npm run db:seed`.
4. Ejecutar `npm run dev`; la interfaz pública queda en `http://localhost:4300/` y la API en `http://localhost:4300/api/v1`. El contrato está en `/openapi.yaml`.
5. Ejecutar `npm run check` antes de cada commit y `npm run test:integration` con la base levantada.
6. Ejecutar `npm run coverage:full` con la base sembrada para medir dominio y todos los servicios; el 1 de noviembre de 2026 pasó con PostgreSQL 17 de servidor: 39 pruebas, 86.41 % de sentencias y 78.98 % de ramas.

La colección importable de Postman está en `docs/ecclesia.postman_collection.json` (58 solicitudes). Se regenera con `npm run api:postman`. Tras iniciar sesión, guarda el JWT en la variable `token` de la colección. Los cuerpos generados son ejemplos de estructura y se completan con los identificadores y datos ficticios del flujo elegido.

El catálogo geográfico se importó desde el [servicio oficial de INEGI](https://www.inegi.org.mx/servicios/catalogounico/). La versión/corte debe quedar registrada en el seed. El directorio usa 40 templos reales con fuente y enlace a Google Maps; los datos de actividad, patrimonio, finanzas y personas de la demostración son simulados. Ver `docs/fuentes-iglesias.md`.

La base embebida usa PostgreSQL en WASM para desarrollo local. Los datos persisten en `data/pglite-db/`, excluido de Git. La migración, semilla, concurrencia e integración también se verificaron sobre PostgreSQL 17 de servidor. Las capacidades de la semilla son cifras de demostración, identificadas por `capacity_is_demo`.

## Usuarios de demostración local

Estos usuarios son ficticios y se crean solo con `npm run db:seed` fuera de producción. El acceso del personal se abre desde el menú de la aplicación en `http://localhost:4300/#gestion`.

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
- `docs/defensa.md` y `docs/defensa_oral_completa.md`: esquema y guion desarrollado de 20 minutos.
- `docs/repositorios-remotos.md`: tres repositorios públicos y enlace de Sites.
- `docs/fuentes-iglesias.md`: fuentes y alcance de los 40 templos reales.
- `docs/operacion.md`: configuración, arranque, respaldo y restauración en PostgreSQL de servidor.

El arnés reutilizable está en el repositorio hermano `ecclesia-arnes`, separado del producto.
