# Arquitectura del arnés Ecclesia

## Capas

`HTTP → controlador/ruta → servicio → repositorio → PostgreSQL`. El servicio usa funciones de `domain/` para reglas puras. `domain/` no importa ninguna capa; `repository/` no importa HTTP; las rutas no importan SQL. El adaptador de autenticación produce identidad y permisos; cada servicio verifica alcance nacional o de iglesia.

```text
src/
  app.js                 composición de rutas y errores
  domain/                índice, traslapes, estados y centavos
  modules/<modulo>/      routes.js, service.js, repository.js, schemas.js
  infrastructure/db/     conexión, migraciones y seeds
  infrastructure/auth/   JWT y comprobación de roles/iglesias
tests/                   dominio e integración
```

## Invariantes

- `church_id` limita escrituras y lecturas privadas; el permiso nacional es explícito.
- Las fechas de una celebración se guardan con instante UTC y zona IANA de la iglesia; los horarios recurrentes guardan día y hora local.
- Los importes usan `BIGINT` en centavos. No se usa coma flotante para sumas financieras.
- El índice patrimonial se calcula con reglas versionadas y una fecha de referencia, sin leer la base dentro de la función.
- Los flujos de espacios se modelan como transiciones permitidas, no como texto libre.

## Verificación

`npm run lint`, `npm run format:check`, `npm test`, `npm run deps:check` y `npm run check`. La política de dependencias se automatiza en el proyecto; una excepción exige ADR.
