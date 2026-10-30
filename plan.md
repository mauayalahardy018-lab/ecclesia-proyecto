# Plan de desarrollo de Ecclesia

## Propósito y estado

Construir el sistema nacional descrito en el documento **Proyecto Ecclesia — Sistema Nacional de Gestión de Iglesias**. Este proyecto es distinto del prototipo `aplicacion-iglesia`: se conservará su estilo como referencia visual, pero no se considerarán cumplidos los requisitos nacionales por tener pantallas parecidas.

**Estado inicial:** análisis en curso. **Herramienta de IA principal:** Codex. **Stack elegido:** Node.js con Express, PostgreSQL, Zod, Vitest y Supertest. La elección aprovecha la experiencia del prototipo en JavaScript; se registrará en ADR-001. Los requisitos que dependen de respuestas del docente/cliente se marcarán `PENDIENTE`, sin inventar una validación.

## Regla de avance

Cada tarea se cierra con código, prueba, requisito trazado y revisión. El documento de requerimientos, las preguntas y el modelo se preparan antes de dar por definitivo un flujo. Las reglas explícitas del caso pueden implementarse con una hipótesis documentada mientras llegan respuestas; cualquier respuesta posterior obliga a revisar el código y las pruebas afectadas.

## Orden de trabajo

| Orden | Entrega | Trabajo | Comprobación de salida |
|---|---|---|---|
| 0 | Análisis | Actores, RF/RNF/RN con origen, preguntas al cliente, criterios, glosario y trazabilidad | Cada párrafo del caso tiene cobertura; dudas visibles |
| 1 | Arnés y base | Repositorios separados; AGENTS, arquitectura, cinco ADR, cinco prompts, módulo de referencia, lint, formato, dependencias, pruebas y hook | Un módulo nuevo puede seguir el ejemplo y pasar los controles |
| 2 | Geografía e iglesias | Catálogo INEGI de 32 entidades y municipios, localidades usadas, CRUD de iglesias, cierre lógico y aislamiento por iglesia | Consulta pública por estado, municipio, localidad, tipo, nombre y capacidad; ficha completa |
| 3 | Patrimonio | Objetos, estados, año/siglo, INAH, parámetros versionados, índice, distinción y ranking | Prueba pura del ejemplo **35.5**; excluye objetos no vigentes e iglesias cerradas |
| 4 | Servicios y pláticas | Servicios, costo/gratuidad/donativo, requisitos, citas, duración, horarios; preparación, sesiones, cupos y responsable | Ficha pública muestra oferta y pláticas por iglesia |
| 5 | Sacerdotes y misas | Sacerdotes, asignaciones, horario recurrente local, agenda, validación de traslapes, misa celebrada y sustituciones auditadas | No se asigna un sacerdote a dos misas simultáneas; se ve titular y oficiante real |
| 6 | Diezmos | Un registro por misa celebrada; montos exactos en centavos; correcciones auditadas; consultas por día/semana/mes, horario y sacerdote | Duplicados rechazados; reportes financieros privados por iglesia |
| 7 | Espacios y solicitudes | Tipos de espacio públicos sin precio, solicitud anónima con folio/clave, cotización privada, aceptación, rechazo, cancelación y caducidad | Transiciones válidas, privacidad y vencimiento de 15 días probados |
| 8 | Datos, calidad y entrega | Seeds mínimos del caso, OpenAPI, Postman, cobertura, CI, bitácora, README, portabilidad, reflexión y defensa | Arranque documentado, controles verdes, demostración reproducible |

## Dependencias y prioridades

- La geografía precede a las iglesias; las iglesias preceden a objetos, servicios, pláticas, horarios y solicitudes.
- El índice depende del inventario y de criterios configurables. Su cálculo es una función pura, sin acceso a datos.
- El diezmo depende de una misa **celebrada**, no solo de un horario planificado.
- El acceso público no exige cuenta. El personal de una iglesia solo opera registros de esa iglesia.
- Los flujos marcados en el caso «si alcanza el tiempo» quedan después de los obligatorios.

## Evidencia de entrega obligatoria

1. `docs/requerimientos.md` con RF, RNF, reglas de negocio, origen, prioridad, criterios y preguntas respondidas por el cliente.
2. Proyecto Git remoto con migraciones, seeds, pruebas, README, `.env.example`, API `/api/v1` y OpenAPI.
3. Arnés Git remoto separado con guía, `AGENTS.md`, arquitectura, cinco ADR, cinco prompts, módulo de referencia, controles, definición de terminado y CHANGELOG.
4. `docs/modelo-datos.md`, diagrama de estados, colección Postman, bitácora honesta de al menos 20 entradas significativas (cinco errores reales), prueba de portabilidad en otro repositorio y reflexión final.
5. Defensa oral de 20 minutos, video de portabilidad de máximo cinco minutos y explicación del código sin IA.

## Datos semilla mínimos

32 estados y todos sus municipios del INEGI; localidades que usen las iglesias; 40 iglesias en al menos tres estados y ocho municipios; 120 objetos (15 con 200 años y cinco con 300); cuatro servicios y dos tipos de pláticas por iglesia; 15 sacerdotes (tres en varias iglesias); una misa diaria por iglesia; cuatro semanas de celebraciones y diezmos en seis iglesias; 12 solicitudes con estados variados; un usuario por rol. Los datos personales serán ficticios y cualquier objeto, precio o diezmo asociado a una iglesia real se marcará como ficticio.

## Preguntas que no pueden presentarse como resueltas

Confirmar con el docente/cliente el corte del catálogo INEGI, la fecha de referencia de antigüedad, si un par de objetos se registra como pieza o conjunto, la política de redondeo del índice, las reglas de traslado entre iglesias, los permisos exactos del personal nacional y local, los criterios de cotización y retención de datos personales. Se documentan en `docs/requerimientos.md`.

## Estado de avance

La columna de estado de cada requisito vive en `docs/trazabilidad.md`: `PENDIENTE`, `EN CURSO`, `IMPLEMENTADO` o `VALIDADO`. Un módulo no pasa a `VALIDADO` por tener interfaz; requiere pruebas y datos semilla representativos.

### Avance comprobado el 30 de octubre de 2026

- Requisitos, reglas, preguntas P-01–P-10, modelo y estados documentados. Las preguntas aún no tienen respuesta del docente.
- Arnés separado con AGENTS, arquitectura, cinco ADR, cinco prompts, dos checklists y CHANGELOG.
- Base de datos embebida de desarrollo migrada y sembrada: 32 entidades, 2478 municipios, 40 iglesias, 120 objetos, 15 sacerdotes y 12 solicitudes. El servidor PostgreSQL convencional aún no se ejecutó en este equipo.
- API de directorio, patrimonio, servicios, pláticas, sacerdotes, misas, diezmos, espacios e identidad; interfaz pública de búsqueda, ficha, ranking y solicitudes; panel inicial para personal; contrato OpenAPI.
- `npm run check` y pruebas de integración con datos sembrados. Los errores reales corregidos están en la bitácora; la defensa escrita es un guion, no una defensa realizada.

### Pendientes antes de declarar la aplicación terminada

1. Responder y validar con el docente/cliente P-01–P-10; ajustar reglas y criterios afectados.
2. Completar y probar la interfaz de gestión: edición de objetos/oferta, usuarios, criterios, correcciones de diezmo, estados de solicitudes y todas las tareas desde navegador.
3. Verificar el bloqueo transaccional de asignaciones y celebraciones concurrentes en PostgreSQL de servidor; ampliar consultas de misas celebradas y caducidad automática de cotizaciones sin visita del solicitante.
4. Ampliar pruebas de integración para todas las rutas y permisos, y medir cobertura de **todos** los servicios además del dominio.
5. Repetir migración, seed y pruebas en PostgreSQL de servidor; preparar despliegue, seguridad operativa y copia de respaldo.
6. Publicar los repositorios remotos, grabar el video real de la portabilidad ya probada localmente y realizar la defensa oral por el alumno.
7. Solo después de los obligatorios, implementar RF-28–RF-31 deseables si el tiempo del curso lo permite.
