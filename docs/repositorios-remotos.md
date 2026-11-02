# Repositorios remotos de la entrega

Un repositorio local existe en esta computadora. Un repositorio remoto es su copia alojada en un servicio Git (por ejemplo GitHub) y tiene una URL compartible para que el docente pueda revisar código, historial y documentación. Un enlace a la aplicación web no sustituye la URL del repositorio.

Se publicaron tres repositorios Git independientes y públicos el 1 de noviembre de 2026, en la rama `main`:

| Repositorio | Contenido | URL |
|---|---|---|
| `ecclesia-proyecto` | Aplicación, migraciones, semillas, pruebas y documentación del caso | https://github.com/mauayalahardy018-lab/ecclesia-proyecto |
| `ecclesia-arnes` | Reglas, prompts, checklists, módulo de referencia y hook reutilizable | https://github.com/mauayalahardy018-lab/ecclesia-arnes |
| `ecclesia-portabilidad-prueba` | Proyecto ajeno a Ecclesia donde se instaló y ejecutó el arnés, con evidencia y video | https://github.com/mauayalahardy018-lab/ecclesia-portabilidad-prueba |

La demostración académica publicada en Sites está en https://ecclesia-demo-nacional-mexico.mauayalahardy018.chatgpt.site. El enlace `#gestion` abre el panel dentro de esa misma aplicación. Sites guarda cambios solo en el navegador usado. La aplicación completa con API, autenticación y PostgreSQL está en el repositorio del producto y requiere desplegar servidor y base para uso compartido.

Verificación: `git ls-remote origin refs/heads/main` devolvió los commits publicados de los tres repositorios. El sitio público abrió el directorio de 40 iglesias y el panel integrado.
