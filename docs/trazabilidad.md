# Trazabilidad del caso al producto

`IMPLEMENTADO` indica código escrito; `VALIDADO` exige ejecutar pruebas con base de datos y datos representativos. Los requisitos de la nueva Ecclesia no son los RF-01 a RF-10 del portal anterior.

| Requisitos | Origen | Código / evidencia actual | Estado |
|---|---|---|---|
| RF-01 a RF-05 | Las iglesias | `modules/iglesias`, `modules/geografia`, migración/seed INEGI, 40 templos reales con fuentes y enlaces Maps, seis tipos incluidos basílica, capacidad de demostración identificada, ficha con datos verificables, pruebas de filtro y cierre/reactivación | VALIDADO técnicamente en PostgreSQL 17; P-01–P-10 aún requieren respuesta del docente |
| RF-06 a RF-10 | El patrimonio; Iglesias reconocidas | `domain/patrimony.js`, `modules/patrimonio`; prueba 35.5, edición/estado y criterios versionados; ranking con 40 iglesias | IMPLEMENTADO localmente; criterios pendientes de P-02/P-04 y pruebas negativas exhaustivas |
| RF-11 a RF-13 | Servicios y pláticas | `modules/oferta`, ficha pública, búsqueda municipal, panel de alta/edición/activación; integración de edición | IMPLEMENTADO localmente; falta matriz completa de pruebas |
| RF-14 a RF-18 | Misas y padres | `domain/schedules.js`, `modules/misas`; traslape y dos altas concurrentes del mismo sacerdote en iglesias distintas probados con PostgreSQL 17 | VALIDADO técnicamente para RF-16; zonas/agenda requieren acuerdo del cliente |
| RF-19 a RF-21 | El diezmo | `domain/money.js`, `modules/diezmos`, restricción única e historial; reportes por día, semana, mes, horario y sacerdote con promedio y extremos; pruebas de rol, iglesia, duplicado y agrupaciones | VALIDADO técnicamente para RF-21; redondeo requiere acuerdo del cliente |
| RF-22 a RF-26 | Criptas y espacios | `domain/spaces.js`, `modules/espacios`, formulario/seguimiento público, estados/gestión privada y caducidad automática; pruebas de privacidad y vencimiento | IMPLEMENTADO localmente; falta revisión de retención de datos |
| RF-27 | Quién usará | `infrastructure/auth/access.js`, `user_churches`, panel de usuarios/roles/asignaciones; matriz de acceso anónimo, coordinación y personal asignado/no asignado probada en PostgreSQL 17 | VALIDADO técnicamente para la matriz implementada; permisos definitivos requieren acuerdo del cliente |
| RF-28 a RF-31 | Si alcanza el tiempo | Búsqueda de pláticas, agenda semanal, comparación financiera e inventario/asignación; pruebas de integración | IMPLEMENTADO localmente |
| RNF-01 a RNF-08 | Lineamientos técnicos | Express, PostgreSQL 17 de servidor, Zod, JWT, bcrypt, Vitest, OpenAPI, Postman, CI, arnés, interfaz pública; 39 pruebas y cobertura dominio+servicios 86.41 % sentencias / 78.98 % ramas; video local de portabilidad | EN CURSO: faltan repositorios remotos, revisión del cliente y defensa oral |

Las respuestas de P-01 a P-10 se añadirán aquí con fecha y origen. No se marcará `VALIDADO` una decisión que el docente no haya confirmado.
