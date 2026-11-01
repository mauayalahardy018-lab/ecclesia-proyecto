# Operación y entrega de Ecclesia

## Ambiente local verificable

Instalar Node.js compatible con las dependencias del proyecto y PostgreSQL 17. Copiar `.env.example` a `.env`, sustituir `JWT_SECRET` por un secreto largo generado para el ambiente y ajustar `DATABASE_URL`. `.env` y `data/` quedan fuera de Git. Para la base PostgreSQL embebida del desarrollo, usar `DB_POOL_MAX=1`; para un servidor normal, comenzar con 10 y ajustar según capacidad y pruebas de carga.

```powershell
docker compose up -d db
npm ci
npm run db:migrate
npm run db:seed
npm run check
npm run test:integration
npm start
```

La semilla crea datos y credenciales **de demostración**. No ejecutar `db:seed` en un ambiente con datos reales. `GET /health` comprueba que el proceso HTTP responde; la verificación de base requiere una consulta real, por ejemplo el directorio.

## Antes de exponer un servidor

- Aprobar con el cliente las decisiones P-01–P-10 de `docs/requerimientos.md`, en especial permisos, reglas de cotización y retención de datos.
- Sustituir usuarios y contraseñas de demostración, usar secretos fuera del repositorio y limitar el acceso a la base.
- Servir HTTPS mediante proxy, restringir CORS y habilitar registros operativos sin claves, importes ni datos personales.
- Probar migraciones, autorización por iglesia, concurrencia de sacerdotes y restauración sobre PostgreSQL de servidor. El uso de PGlite local no sustituye esa prueba.
- Configurar monitoreo del proceso y de la tarea de caducidad de cotizaciones. El proceso HTTP la ejecuta al iniciar y cada minuto.

## Respaldo y restauración de PostgreSQL de servidor

Con un `DATABASE_URL` del ambiente de destino y las herramientas oficiales `pg_dump` y `pg_restore`, crear un respaldo en formato custom y guardarlo cifrado en una ubicación autorizada:

```powershell
pg_dump --format=custom --no-owner --file=ecclesia.backup "$env:DATABASE_URL"
```

Ensayar la restauración **en una base de prueba vacía**, nunca sobre la base activa:

```powershell
pg_restore --no-owner --dbname="$env:DATABASE_URL_PRUEBA" ecclesia.backup
```

Comprobar tablas, conteos, acceso por rol y una ficha pública tras restaurar. Definir frecuencia y retención de respaldos con el responsable de datos; todavía no hay una política aprobada para datos reales.
