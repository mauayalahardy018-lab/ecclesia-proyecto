# Defensa oral de Ecclesia

Guion de 20 minutos para presentar el Sistema Nacional de Gestión de Iglesias. Es una guía de exposición: la defensa oral y el video personal deben ser realizados por el estudiante. La demostración académica de Sites guarda cambios en cada navegador; las pruebas de API y persistencia real se muestran desde el proyecto Express con PostgreSQL.

## Mensaje central

Ecclesia permite consultar iglesias y su actividad sin cuenta, mientras el personal gestiona únicamente las iglesias y funciones autorizadas. La aplicación nacional se construyó a partir del documento del caso, con reglas de dominio separadas, base de datos relacional, auditoría y controles automáticos. Los nombres y ubicaciones de los templos del directorio están documentados; los datos de patrimonio, horarios, personas y finanzas del ejercicio son ficticios.

## Preparación de la demostración

1. Tener abiertos el documento de requisitos, la trazabilidad, el repositorio del producto, el repositorio del arnés y la prueba de portabilidad.
2. Abrir la aplicación y confirmar que directorio, ficha, ranking, solicitudes y panel de gestión cargan. Para mostrar operaciones reales, arrancar Express con PostgreSQL y usar la interfaz local; la versión de Sites sirve para recorrer el diseño y los datos de demostración.
3. Conservar una terminal en la raíz del producto para `npm run check`, `npm run test:integration` y `npm run coverage:full`. Preparar las variables de entorno sin mostrar secretos.
4. Tener localizados los resultados verificados: 32 estados, 2478 municipios, 40 iglesias, 120 objetos, 15 sacerdotes y 12 solicitudes en la semilla; 15 pruebas de integración y 39 pruebas en cobertura completa con PostgreSQL 17.

## Guion cronometrado

### 0:00 a 2:00  Problema y actores

**Decir:** “El caso pide una plataforma nacional, no una página para una sola iglesia. Una persona visitante necesita encontrar iglesias por ubicación y consultar servicios, pláticas, misas y patrimonio. Coordinación administra el catálogo nacional. La administración local y tesorería tienen tareas distintas y su acceso depende de la iglesia asignada. Una persona puede solicitar un espacio sin crear una cuenta y consultar su respuesta con folio y clave.”

**Mostrar:** portada, búsqueda y `docs/requerimientos.md`. Señalar los actores y los RF obligatorios frente a los cuatro deseables. Aclarar que el prototipo anterior fue una referencia visual, sin contarlo como implementación de los requisitos nacionales.

### 2:00 a 4:00  Análisis y límites del caso

**Decir:** “Convertí el caso en 27 requisitos funcionales obligatorios, cuatro deseables, ocho no funcionales, reglas de negocio y diez preguntas al cliente. Cada requisito tiene origen, criterio de aceptación y evidencia en la trazabilidad. Las preguntas P-01 a P-10 no tienen respuesta atribuida al docente; por eso las decisiones dependientes se identifican como hipótesis revisables.”

**Mostrar:** trazabilidad y una pregunta abierta, por ejemplo el corte del catálogo INEGI o la política de redondeo. Explicar cómo una respuesta posterior llevaría a cambiar ADR, código, pruebas y documentación.

### 4:00 a 6:00  Arnés y proceso de trabajo

**Decir:** “Separé el producto, el arnés y la prueba de portabilidad en repositorios Git. El arnés contiene AGENTS, arquitectura, cinco decisiones ADR, cinco prompts, dos checklists, módulo de referencia y hook pre-commit. Antes de programar una tarea leo el requisito y defino archivos, validación, permisos, migración y pruebas. Al terminar ejecuto los controles y registro el resultado real en la bitácora.”

**Mostrar:** `ecclesia-arnes/README.md`, `core/AGENTS.base.md`, `reference-module/tasks/` y el hook. Explicar que el código de tareas del repositorio de portabilidad no importa Ecclesia.

### 6:00 a 8:00  Geografía y directorio

**Decir:** “El catálogo geográfico conserva claves INEGI. La búsqueda filtra por entidad, municipio, localidad, tipo, nombre y capacidad, con paginación. Los 40 registros usan templos documentados en tres estados y ocho municipios, con enlace a Google Maps y fuente. La capacidad sembrada se marca como valor de demostración para no atribuir una cifra inventada a una iglesia real.”

**Mostrar:** filtro de basílica, ficha de la Catedral Basílica de Guadalajara y enlace a Maps. Cerrar y reactivar una iglesia de prueba en el entorno local para demostrar que desaparece de la consulta pública sin perder historial.

### 8:00 a 10:00  Patrimonio e índice

**Decir:** “Cada objeto registra su estado y no se elimina silenciosamente. La función pura de dominio calcula el índice según antigüedad, tipo y catalogación, usando criterios versionados. El ejemplo del caso suma 35.5 puntos en la prueba. Los objetos perdidos, prestados o dados de baja no puntúan; las iglesias cerradas no aparecen en el ranking.”

**Mostrar:** `src/domain/patrimony.js`, la prueba del ejemplo y el ranking. Distinguir patrimonio ficticio de identidad real del templo.

### 10:00 a 12:00  Servicios, pláticas y misas

**Decir:** “La ficha reúne servicios, requisitos, costo o donativo, pláticas y horarios. Un horario semanal es una intención, no una misa celebrada. La agenda maneja hora local y zona horaria de la iglesia. La regla impide traslapar al mismo sacerdote; una prueba concurrente en PostgreSQL 17 creó una asignación y rechazó la otra con conflicto.”

**Mostrar:** ficha y caso de prueba de traslape. Señalar que la semilla de oferta, horarios y sacerdotes es ficticia.

### 12:00 a 14:00  Celebraciones y diezmos

**Decir:** “La celebración guarda fecha y oficiante real. El diezmo se relaciona con la celebración, con un registro por misa, y el importe se almacena en centavos enteros. Las correcciones registran valor anterior, valor nuevo, autor, motivo y fecha. Los reportes privados agrupan por día, semana, mes, horario o sacerdote; muestran total, promedio y extremos. Una persona sin permiso para esa iglesia recibe 403.”

**Mostrar:** formulario de tesorería, reporte y prueba de duplicado/permiso. No exponer importes de personas reales: los valores de la demostración son ficticios.

### 14:00 a 16:00  Espacios y solicitudes

**Decir:** “El visitante ve tipos de espacio sin precios y puede enviar una solicitud anónima. Recibe folio y clave; el servidor conserva el hash de la clave. El personal revisa y responde. La cotización es privada, puede aceptarse o rechazarse y vence a los 15 días. Las transiciones se prueban para impedir cambios inválidos.”

**Mostrar:** envío y seguimiento en el entorno local; una consulta con clave incorrecta y una transición inválida. En Sites, este flujo es una simulación guardada solo en el navegador.

### 16:00 a 18:00  Arquitectura, seguridad y pruebas

**Decir:** “La ruta valida HTTP, el servicio aplica reglas, el repositorio ejecuta SQL parametrizado y PostgreSQL conserva los datos. `domain/` contiene funciones puras sin Express ni SQL. JWT identifica al usuario; rol y `user_churches` limitan las operaciones. Las migraciones son versionadas. Lint, formato, límites de dependencias, contrato OpenAPI y pruebas son una puerta de calidad, también en CI.”

**Mostrar:** estructura de un módulo y salida de `npm run check`. La integración sobre PostgreSQL 17 pasó 15 de 15; la cobertura conjunta de dominio y servicios fue 86.41 % en sentencias y 78.98 % en ramas, por encima del umbral global del 70 %.

### 18:00 a 20:00  Portabilidad, resultados y preguntas

**Decir:** “Instalé el arnés en un proyecto de tareas independiente. Copié sus reglas y el hook, adapté un módulo de ruta, servicio y repositorio, corregí una ruta relativa de importación y ejecuté lint, formato, dependencias y una prueba. El video de 1:36 documenta comandos y salida local. El proyecto sigue sujeto a las respuestas del cliente y a la defensa personal de este trabajo.”

**Mostrar:** repositorios separados, evidencia del hook y video. Cerrar con la diferencia entre la versión local con PostgreSQL y la demostración de Sites: la segunda no comparte datos ni ofrece autenticación real.

## Preguntas probables

**¿Por qué hay tres repositorios?** El producto tiene la implementación. El arnés contiene instrucciones reutilizables. El tercero demuestra que esas instrucciones se pudieron instalar en otro dominio sin copiar código de Ecclesia.

**¿Cómo se evita que una iglesia vea datos de otra?** El servidor valida JWT, rol y asignación en `user_churches`, y las consultas privadas filtran por `church_id`. La matriz de integración incluye accesos autorizados y rechazos 401/403.

**¿Por qué los importes están en centavos?** Las sumas en enteros evitan errores de representación decimal. La API presenta pesos, pero la base almacena centavos.

**¿Qué diferencia hay entre horario y celebración?** El horario define recurrencia. La celebración registra la fecha y el oficiante real. Solo esta última puede tener un diezmo.

**¿Cómo se calculó el índice?** Es una función de dominio que recibe objetos vigentes, criterios versionados y fecha de referencia. La prueba reproduce el resultado de 35.5 del caso.

**¿Qué es real en el directorio?** La identidad y ubicación de cada templo se documentan con fuente y Maps. La capacidad, los objetos, servicios, horarios, personas, solicitudes y montos son datos académicos ficticios.

**¿Por qué Sites no usa la base local?** Sites publica una demostración estática con almacenamiento por navegador. El servidor Express usa PostgreSQL y no puede convertirse en un servicio compartido solo por copiar archivos estáticos. El código completo y sus pruebas están en el repositorio del producto.

## Límites que se deben mencionar

- Las preguntas P-01 a P-10 siguen esperando respuesta del docente o cliente. No se presenta una hipótesis como validación suya.
- El Site permite recorrer el diseño y probar cambios locales del navegador. No representa autenticación, roles seguros, pagos ni persistencia compartida.
- Las cuentas, objetos, horarios, personas e importes de semilla son ficticios. No ingresar datos reales en la demostración.
- El alumno debe ensayar y realizar su defensa oral, explicar el código sin apoyo de IA y grabar personalmente el video si el documento lo exige.

## Cierre sugerido

“La entrega demuestra un sistema nacional trazado desde el caso, con datos de referencia identificados, reglas críticas probadas, separación de responsabilidades y un arnés portable. Puedo reproducir los controles y explicar los límites que aún dependen de decisiones del cliente.”
