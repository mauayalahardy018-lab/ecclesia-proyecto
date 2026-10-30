# Reglas para Codex

## Contexto

Leer `docs/PROYECTO.md`, `docs/requerimientos.md`, `docs/trazabilidad.md` y `ARCHITECTURE.md` antes de modificar código. El stack de Ecclesia es Express + PostgreSQL. Un requisito del documento del caso es evidencia de alcance, no una respuesta a sus ambigüedades.

## Siempre

- Vincular cada tarea con un RF, RN y criterio de aceptación.
- Proponer plan de archivos, validaciones, permisos, pruebas y migraciones antes del cambio.
- Mantener controlador → servicio → repositorio; el dominio puro no importa Express ni SQL.
- Validar entrada y permisos en el servidor, incluido el `iglesia_id` de cada operación local.
- Usar parámetros SQL y migraciones versionadas; dinero en centavos enteros.
- Conservar el historial de cierres, objetos, sustituciones, diezmos y solicitudes.
- Probar los casos de éxito, límites, errores y accesos entre iglesias.
- Ejecutar `npm run check` antes de proponer un commit; registrar resultados reales.
- Mantener ejemplos ficticios y señalarlo cuando se usen iglesias reales.

## Nunca

- Inventar una respuesta del cliente, una prueba aprobada, una entrada de bitácora o una evidencia de defensa.
- Exponer contraseñas, claves, datos personales, cotizaciones o importes financieros en logs o respuestas públicas.
- Resolver reglas de negocio en rutas/controladores ni consultar la base desde funciones de dominio.
- Borrar silenciosamente historial patrimonial, financiero o de solicitudes.
- Tratar un horario recurrente como misa celebrada.
- Contar objetos perdidos, prestados o dados de baja en el índice.
- Entregar un cambio con lint, formato, pruebas o reglas de dependencias fallando.

## Al terminar una tarea

Actualizar trazabilidad y bitácora, aplicar `core/checklists/definicion-de-terminado.md` y explicar qué cambió, cómo se verificó y qué falta.
