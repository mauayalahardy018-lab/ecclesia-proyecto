# ADR 004 Identidad y autorización

Estado: aceptado provisionalmente el 2026-10-30.

Decisión: consulta pública anónima; personal con contraseñas bcrypt y JWT de duración corta. La identidad lleva rol, y los permisos por iglesia se verifican contra asignaciones en PostgreSQL en cada operación. Un rol nacional no implica escritura local sin permiso explícito. Consecuencia: no se reutilizan las cuentas ni sesiones de la demo de Sites. Política de recuperación queda pendiente de respuesta del cliente.
