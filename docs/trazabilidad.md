# Trazabilidad del caso al producto

`IMPLEMENTADO` indica código escrito; `VALIDADO` exige ejecutar pruebas con base de datos y datos representativos. Los requisitos de la nueva Ecclesia no son los RF-01 a RF-10 del portal anterior.

| Requisitos | Origen | Código / evidencia actual | Estado |
|---|---|---|---|
| RF-01 a RF-05 | Las iglesias | `modules/iglesias`, `modules/geografia`, migración/seed INEGI, interfaz pública, prueba de filtro y cierre/reactivación | EN CURSO: falta CRUD visual y prueba en PostgreSQL de servidor |
| RF-06 a RF-10 | El patrimonio; Iglesias reconocidas | `domain/patrimony.js`, `modules/patrimonio`; prueba 35.5; ranking consultado con 40 iglesias | EN CURSO: falta interfaz de gestión y pruebas negativas completas; criterios con pregunta P-02/P-04 |
| RF-11 a RF-13 | Servicios y pláticas | `modules/oferta`, tablas `services` y `talks`, ficha pública integrada | EN CURSO: falta gestión visual y pruebas de edición |
| RF-14 a RF-18 | Misas y padres | `domain/schedules.js`, `modules/misas`; traslape rechazado en prueba con BD | EN CURSO: falta controlar concurrencia, gestión visual y validar zonas/agenda con cliente |
| RF-19 a RF-21 | El diezmo | `domain/money.js`, `modules/diezmos`, restricción única e historial; pruebas de rol, iglesia y duplicado | EN CURSO: falta prueba de corrección/reporte detallado, interfaz y acuerdo de redondeo |
| RF-22 a RF-26 | Criptas y espacios | `domain/spaces.js`, `modules/espacios`, diagrama de estados, formulario/seguimiento público; prueba de privacidad y caducidad con BD | EN CURSO: falta gestión visual, caducidad automática y revisión de retención de datos |
| RF-27 | Quién usará | `infrastructure/auth/access.js`, `user_churches`, panel inicial en `public/gestion.html`; prueba negativa de tesorero ajeno con 403 | EN CURSO: falta gestión visual completa y matriz completa de permisos |
| RF-28 a RF-31 | Si alcanza el tiempo | No iniciado; después de obligatorios | PENDIENTE |
| RNF-01 a RNF-08 | Lineamientos técnicos | Express, PostgreSQL embebido para pruebas, Zod, JWT, bcrypt, Vitest, OpenAPI (40 operaciones), CI, arnés, interfaz pública | EN CURSO: falta PostgreSQL de servidor, cobertura de todos los servicios, repos remotos y portabilidad |

Las respuestas de P-01 a P-10 se añadirán aquí con fecha y origen. No se marcará `VALIDADO` una decisión que el docente no haya confirmado.
