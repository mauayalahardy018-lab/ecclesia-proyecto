# Requerimientos del sistema nacional Ecclesia

## Alcance y fuente

Fuente: documento del caso **Proyecto Ecclesia — Sistema Nacional de Gestión de Iglesias**, apartado «El caso: Coordinación Nacional de Templos», recibido el 30 de octubre de 2026. Esta es una **extracción inicial**, no una validación del cliente. `CONFIRMADO EN EL CASO` significa que el texto lo dice expresamente; no equivale a respuesta posterior del docente. Las preguntas abiertas se dejan al final.

## Actores

| Actor | Objetivo | Acceso previsto |
|---|---|---|
| Visitante | Encontrar iglesias, misas, servicios, pláticas y patrimonio; solicitar espacios | Público sin cuenta |
| Personal de Coordinación | Mantener catálogos, iglesias, usuarios y reglas del índice | Nacional |
| Administrador de iglesia | Mantener los datos y operaciones de sus iglesias asignadas | Solo iglesias autorizadas |
| Tesorero de iglesia | Capturar y consultar el diezmo de sus iglesias asignadas | Solo finanzas autorizadas |
| Sacerdote | Aparecer en asignaciones, agenda y misas celebradas | Entidad del dominio; no se confirma que inicie sesión |
| Solicitante de espacio | Seguir una solicitud con folio y clave | Sin cuenta; solo su solicitud |

## Requerimientos funcionales

Prioridad `O` obligatoria y `D` deseable. Los identificadores son **nuevos** y no corresponden a los RF del prototipo anterior.

| ID | Prioridad | Requerimiento verificable | Origen del caso |
|---|---|---|---|
| RF-01 | O | El visitante selecciona un estado y consulta las iglesias activas de ese estado sin iniciar sesión. | Las iglesias; Quién usará el sistema |
| RF-02 | O | El visitante filtra el listado por municipio, localidad, tipo, nombre y capacidad, con paginación. | Las iglesias; Lineamientos técnicos |
| RF-03 | O | El visitante abre una ficha con dirección, contacto, capacidad, año de construcción, coordenadas cuando existan y oferta de la iglesia. | Las iglesias |
| RF-04 | O | La Coordinación registra y mantiene iglesias de los seis tipos del caso, vinculadas a claves INEGI de entidad, municipio y localidad. | Las iglesias; Quién usará el sistema |
| RF-05 | O | El personal autorizado cierra o reactiva una iglesia conservando su historial; las cerradas no aparecen en la consulta pública ni en el ranking. | Las iglesias; Iglesias reconocidas |
| RF-06 | O | El administrador registra objetos patrimoniales con tipo, fecha exacta o siglo, material, conservación, ubicación e indicador de catalogación INAH. | El patrimonio |
| RF-07 | O | El administrador cambia un objeto a perdido, prestado o dado de baja sin borrarlo. | El patrimonio |
| RF-08 | O | El sistema calcula el índice patrimonial con criterios vigentes configurables y muestra la distinción que corresponda. | Iglesias reconocidas |
| RF-09 | O | El visitante consulta rankings nacional, estatal, municipal y local, ordenados por índice descendente. | Iglesias reconocidas |
| RF-10 | O | El visitante busca iglesias por tipo y antigüedad de objetos, acotando por estado, municipio o localidad. | Iglesias reconocidas |
| RF-11 | O | El administrador registra servicios con requisitos, duración, necesidad de cita, costo fijo, gratuidad o donativo voluntario y días/horarios. | Los servicios y las pláticas |
| RF-12 | O | El administrador registra pláticas con tipo, días, hora, sesiones, costo, cupo, lugar y responsable. | Los servicios y las pláticas |
| RF-13 | O | El visitante consulta servicios y pláticas de cada iglesia, incluidos los horarios de preparación para bautizo. | Los servicios y las pláticas; Quién usará |
| RF-14 | O | El administrador registra sacerdotes y sus asignaciones a una o varias iglesias. | Las misas y los padres |
| RF-15 | O | El administrador registra horarios semanales de misa con día, hora local, clase, idioma, duración y sacerdote previsto. | Las misas y los padres |
| RF-16 | O | El sistema rechaza asignaciones que traslapen misas de un mismo sacerdote en iglesias distintas. | Las misas y los padres |
| RF-17 | O | El visitante consulta los horarios de misa y el sacerdote previsto; el personal consulta la agenda semanal de cada sacerdote. | Las misas y los padres |
| RF-18 | O | El personal registra cada misa celebrada, su fecha/hora y oficiante real; una sustitución conserva autor y motivo. | Las misas y los padres |
| RF-19 | O | El tesorero registra un único diezmo por misa celebrada, con monto exacto en centavos. | El diezmo |
| RF-20 | O | El tesorero corrige un diezmo conservando importe anterior, autor y fecha. | El diezmo |
| RF-21 | O | El tesorero consulta total, promedio y extremos del diezmo por día, semana, mes, horario de misa y sacerdote, solo para su iglesia. | El diezmo |
| RF-22 | O | El visitante ve qué tipos de cripta, nicho, columbario u osario ofrece cada iglesia, sin precio público. | Las criptas y otros espacios |
| RF-23 | O | Una persona envía una solicitud de espacio sin cuenta y recibe folio y clave de seguimiento. | Las criptas y otros espacios |
| RF-24 | O | El administrador revisa la solicitud y responde con cotización privada y condiciones o con falta de disponibilidad. | Las criptas y otros espacios |
| RF-25 | O | El solicitante consulta con folio/clave y acepta o rechaza la cotización, o cancela antes de aceptarla. | Las criptas y otros espacios |
| RF-26 | O | La cotización vence a los 15 días sin respuesta y se conserva el historial de estados. | Las criptas y otros espacios |
| RF-27 | O | La Coordinación gestiona catálogos, usuarios y criterios de cálculo; el personal local modifica solo sus iglesias asignadas. | Quién usará el sistema |
| RF-28 | D | El visitante busca pláticas de un tipo en todas las iglesias de un municipio. | Si alcanza el tiempo |
| RF-29 | D | El sistema genera las misas de la semana a partir del horario recurrente. | Si alcanza el tiempo |
| RF-30 | D | La Coordinación compara diezmos entre iglesias por municipio o estado. | Si alcanza el tiempo |
| RF-31 | D | El administrador asigna inventario de espacios a solicitudes aceptadas. | Si alcanza el tiempo |

## Reglas de negocio

| ID | Regla comprobable | Origen |
|---|---|---|
| RN-01 | Solo iglesias activas aparecen en listados públicos y rankings; cerrar no borra historial. | Las iglesias |
| RN-02 | Un objeto con solo siglo toma como año representativo la mitad de ese siglo; XVIII equivale a 1750. | El patrimonio |
| RN-03 | Un objeto no vigente no suma al índice. | El patrimonio |
| RN-04 | Puntos de antigüedad: menos de 50 años = 1; 50–99 = 2; 100–199 = 4; 200–299 = 7; 300 o más = 10. | Iglesias reconocidas |
| RN-05 | Multiplicadores: imágenes 1.5; retablos, pinturas y murales 1.3; órganos y pianos 1.2; orfebrería, mobiliario litúrgico y documentos 1; otros 0.8. Sumar 5 por catalogación INAH. | Iglesias reconocidas |
| RN-06 | La suma distingue: 40+ sobresaliente; 20 a menos de 40 alto; 8 a menos de 20 valor; menos de 8 sin distinción. | Iglesias reconocidas |
| RN-07 | El ranking omite iglesias cerradas y aquellas sin objetos registrados; orden descendente. | Iglesias reconocidas |
| RN-08 | Una misa dura una hora si no se indica otra duración y un sacerdote no puede tener horarios traslapados. | Las misas y los padres |
| RN-09 | Toda hora de misa se interpreta en la zona horaria local de la iglesia; previsto y oficiante real son datos distintos. | Las misas y los padres |
| RN-10 | Solo una captura de diezmo por misa celebrada; cambios conservan el valor anterior. | El diezmo |
| RN-11 | Los precios de espacios no son públicos; solo el solicitante correspondiente y el personal autorizado ven la cotización. | Las criptas y otros espacios |
| RN-12 | Una cotización vence 15 días después de emitirse; una solicitud aceptada no puede cancelarse por el solicitante. | Las criptas y otros espacios |
| RN-13 | Las operaciones locales quedan restringidas a iglesias asignadas, incluso si el usuario conoce el identificador de otra. | Quién usará el sistema |

## Requerimientos no funcionales y del curso

| ID | Requerimiento verificable | Origen |
|---|---|---|
| RNF-01 | Consulta pública utilizable desde celular, con navegación y formularios accesibles. | Quién usará; Lineamientos técnicos |
| RNF-02 | API REST JSON versionada en `/api/v1`, documentada en OpenAPI, con listados paginados y errores `{codigo,mensaje,detalles}`. | Lineamientos técnicos |
| RNF-03 | Base relacional PostgreSQL, MySQL o MariaDB, migraciones versionadas y seeds. | Reglas generales |
| RNF-04 | Validar entradas con esquemas; guardar contraseñas con bcrypt/argon2; JWT expirable; secretos fuera de Git; SQL parametrizado u ORM. | Lineamientos técnicos |
| RNF-05 | Arquitectura documentada y comprobada; controladores sin reglas de negocio; cálculo del índice como función pura. | Lineamientos técnicos |
| RNF-06 | Cada regla de negocio tiene pruebas; endpoints principales tienen integración; cobertura de dominio/servicios >= 70 %. | Lineamientos técnicos |
| RNF-07 | Lint, formato y reglas de dependencias pasan; README permite arrancar en menos de 10 minutos. | Lineamientos técnicos |
| RNF-08 | Los datos personales de solicitudes y los datos financieros solo son visibles para actores autorizados. | Las criptas; El diezmo |

## Criterios de aceptación clave

1. Para `RF-01`, elegir una entidad devuelve solo iglesias activas de esa entidad; sin cuenta.
2. Para `RF-08`, usando 2026 como año de referencia, el ejemplo del caso suma **35.5**: imagen de 1720 catalogada = 20; retablo de siglo XVIII = 9.1; conjunto de candelabros de 1890 = 4; piano de 1950 = 2.4. Esta interpretación del conjunto se confirmará con el cliente.
3. Para `RF-16`, un sacerdote asignado a 10:00–11:00 no puede recibir otra misa a 10:30, aunque sea en otra iglesia.
4. Para `RF-19`, una segunda captura para la misma celebración falla sin modificar la primera; la corrección guarda el importe anterior.
5. Para `RF-25`, una persona no puede abrir otra solicitud con un folio/clave incorrectos ni ver una cotización ajena.

## Glosario breve

- **Iglesia:** inmueble registrado de tipo catedral, basílica, parroquia, templo, capilla o santuario.
- **Horario de misa:** recurrencia semanal prevista; no demuestra que una misa ocurrió.
- **Misa celebrada:** hecho fechado con oficiante real.
- **Diezmo:** importe capturado para una misa celebrada.
- **Objeto vigente:** pieza que sigue bajo resguardo; no perdida, prestada ni dada de baja.
- **Índice patrimonial:** suma de puntos de objetos vigentes según criterios versionados.
- **Cotización:** precio y condiciones privados para una solicitud de espacio con vencimiento.
- **Clave geoestadística:** identificador oficial INEGI de entidad, municipio o localidad.

## Preguntas al cliente pendientes

| ID | Pregunta | Por qué importa | Estado |
|---|---|---|---|
| P-01 | ¿Qué corte del catálogo INEGI se entrega y quién lo actualiza? | Reproducibilidad de seeds y consultas | PENDIENTE |
| P-02 | ¿La antigüedad se calcula al año en curso, al año de consulta o al año de versión del ranking? | El índice cambia con el tiempo | PENDIENTE |
| P-03 | ¿Un par de candelabros es un objeto conjunto o dos registros? | El ejemplo de 35.5 supone un conjunto | PENDIENTE |
| P-04 | ¿Cómo se redondea el índice cuando produce más de un decimal? | Ranking y distinciones | PENDIENTE |
| P-05 | ¿Se considera tiempo de traslado entre misas en iglesias distintas? | Validación de agenda | PENDIENTE |
| P-06 | ¿Un usuario local puede servir a varias iglesias y con roles distintos? | Modelo de permisos | PENDIENTE |
| P-07 | ¿Qué sucede con horarios futuros al cerrar una iglesia? | Integridad del calendario | PENDIENTE |
| P-08 | ¿Qué datos se piden en la solicitud de espacio y cuánto tiempo se conservan? | Privacidad | PENDIENTE |
| P-09 | ¿Se envían avisos reales de cotización o solo se consultan con folio/clave? | Integraciones | PENDIENTE |
| P-10 | ¿Las cotizaciones vencen al cumplirse 15 días exactos o al final del día local? | Transiciones | PENDIENTE |

## Matriz de trazabilidad inicial

La matriz ejecutable se mantiene en `docs/trazabilidad.md`. Cada RF anterior debe enlazarse allí con módulo de código, prueba y estado; las preguntas pendientes no se registran como respuestas confirmadas.
