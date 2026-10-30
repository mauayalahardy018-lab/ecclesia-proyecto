# Defensa del proyecto Ecclesia

## Alcance y honestidad de la entrega

Esta guía prepara una exposición de **20 minutos** del sistema nacional descrito en el caso. Es un guion de defensa, no un registro de una exposición ya realizada. Las casillas de evidencia se llenan solo después de ejecutar la demostración en un ambiente limpio. Las respuestas P-01 a P-10 de `requerimientos.md` siguen pendientes del docente o cliente; no se atribuyen decisiones a ellos sin una respuesta fechada.

## Tesis de la solución

El visitante puede encontrar iglesias y consultar su actividad sin cuenta. El personal gestiona únicamente el ámbito autorizado. El sistema conserva historial de patrimonio, misas, diezmos y solicitudes en PostgreSQL. Las reglas que más riesgo tienen —puntuación patrimonial, traslapes, dinero y transiciones— se implementan como funciones de dominio y se prueban separadas de HTTP y SQL.

## Estructura de los 20 minutos

| Tiempo | Mensaje | Demostración o evidencia |
|---|---|---|
| 0:00–2:00 | Problema y actores | Visitante, Coordinación, administrador, tesorero y solicitante; `docs/requerimientos.md` |
| 2:00–4:00 | Alcance y preguntas abiertas | RF-01–RF-27 obligatorios; RF-28–RF-31 deseables; P-01–P-10 sin respuesta inventada |
| 4:00–6:00 | Arquitectura y arnés | Repositorios separados, `AGENTS.md`, ADR, prompts, controles, módulo `iglesias` |
| 6:00–8:00 | Geografía y búsqueda | Estado→municipio→localidad; filtros y ficha; iglesia cerrada ausente |
| 8:00–10:00 | Patrimonio | Objeto activo, ejemplo de 35.5, criterio versionado, ranking sin iglesias cerradas |
| 10:00–12:00 | Servicios, pláticas y misas | Ficha pública; asignación de sacerdote, horario local, rechazo de traslape |
| 12:00–14:00 | Celebración y diezmo | Oficiante real; un diezmo por celebración, corrección auditada, reporte con permiso |
| 14:00–16:00 | Solicitud de espacio | Sin cuenta, folio/clave, cotización privada y caducidad a 15 días |
| 16:00–18:00 | Pruebas y decisiones | `npm run check`, cobertura real, restricciones de BD, bitácora de errores auténticos |
| 18:00–20:00 | Portabilidad, límites y siguientes pasos | Instalar arnés en otro repositorio, ejecutar controles, decisiones pendientes y preguntas |

## Secuencia de demostración reproducible

1. Mostrar una base limpia: `docker compose up -d db`, `npm ci`, `npm run db:migrate`, `npm run db:seed`.
2. Verificar los conteos mediante SQL y guardar salida: 32 entidades, todos los municipios del corte INEGI, 40 iglesias, 120 objetos, 15 sacerdotes y 12 solicitudes.
3. Abrir `http://localhost:4300/`; filtrar por estado, municipio, tipo y nombre; abrir una ficha.
4. Consultar `GET /api/v1/rankings` y explicar en una prueba por qué el ejemplo del caso suma 35.5.
5. Iniciar sesión con una cuenta semilla de Coordinación, crear una iglesia de prueba y ver que un usuario de otra iglesia recibe 403.
6. Crear un horario que choque con otro del mismo sacerdote y mostrar 409. Registrar una misa celebrada y una sustitución con motivo.
7. Como tesorero, registrar un diezmo; repetir la misma celebración para mostrar 409; corregirlo y consultar el informe. Probar 403 con un usuario sin acceso.
8. Como visitante, solicitar un espacio; conservar folio y clave; consultar la respuesta privada, aceptar/rechazar y demostrar una transición inválida.
9. Ejecutar `npm run check` y mostrar el reporte de cobertura. La prueba de integración con PostgreSQL debe quedar verde antes de afirmar que el flujo completo funciona.

## Cinco decisiones que debo poder explicar sin ayuda

1. **Índice exacto:** puntos base por antigüedad, multiplicador por tipo y bono INAH; cálculo en décimas para evitar errores de punto flotante. El año de referencia es configurable.
2. **Aislamiento:** el JWT identifica usuario y rol; `user_churches` limita cada mutación/consulta privada a sus iglesias. La Coordinación puede operar a nivel nacional.
3. **Celebración real:** el horario es una intención semanal; `celebrations` guarda fecha y oficiante real. El diezmo se enlaza a esta entidad, no al horario.
4. **Dinero:** almacenar centavos enteros, una fila de diezmo por celebración y una fila de auditoría por corrección. No se muestra al público.
5. **Solicitud privada:** el visitante no necesita cuenta; recibe folio y clave aleatoria. Solo se guarda el hash de la clave. El precio aparece tras autenticación por esa clave y caduca a 15 días.

## Preguntas esperables y respuestas sustentadas

**¿Por qué dos repositorios?** El arnés es reutilizable y debe poder instalarse en otro proyecto sin arrastrar datos, reglas ni código de Ecclesia. El producto contiene el dominio y su implementación.

**¿Qué impide consultar diezmos de otra iglesia?** El middleware comprueba rol y asignación por `user_churches`; las consultas SQL filtran por `church_id`. La prueba negativa entre iglesias es un criterio de cierre.

**¿Qué pasa si se corrige un diezmo?** El valor actual se actualiza en transacción y `tithe_changes` conserva anterior, nuevo, autor, razón y hora. El registro original no se borra.

**¿Cómo se evita doble reservar a un sacerdote?** La regla compara los intervalos semanales en zona horaria local y las celebraciones reales. Se añadió un bloqueo transaccional por sacerdote. Falta demostrar dos solicitudes concurrentes en PostgreSQL de servidor: el socket de la base embebida reinició una conexión durante esa prueba, así que la defensa no debe afirmar que la concurrencia está validada.

**¿Qué información viene de INEGI?** Claves y nombres de estados/municipios, más las localidades usadas en la semilla. Las iglesias, personas, precios y montos de la demostración son ficticios.

**¿Qué hizo Codex y qué revisó la persona?** La bitácora enumera instrucciones, resultados, fallos detectados y correcciones. La persona debe poder reproducir pruebas y explicar las cinco decisiones anteriores; no basta con presentar código generado.

## Evidencia por completar

- [ ] Respuestas fechadas del docente/cliente a las preguntas abiertas.
- [ ] Migración y seed ejecutados sobre PostgreSQL real, con conteos guardados.
- [ ] Pruebas HTTP/BD de autorización, ranking, traslape, diezmo y solicitud.
- [ ] Cobertura de dominio/servicios medida con todos los módulos incluidos, mínimo 70 %.
- [ ] Repositorios remotos y commits con autor real y tráiler de asistencia.
- [ ] Instalación del arnés en segundo repositorio y video de máximo cinco minutos.
- [ ] Ensayo de 20 minutos y defensa oral realizada por el alumno.
