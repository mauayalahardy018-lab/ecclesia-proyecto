# ADR 003 Datos relacionales

Estado: aceptado provisionalmente el 2026-10-30.

Decisión: PostgreSQL con SQL parametrizado, claves foráneas, restricciones e índices; migraciones SQL versionadas. Claves INEGI preservadas como texto para no perder ceros iniciales. Importes en centavos enteros. No se usarán archivos JSON ni almacenamiento del navegador como base de producción. Consecuencia: pruebas de integración requieren PostgreSQL y seeds separados de migraciones.
