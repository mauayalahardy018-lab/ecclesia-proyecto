# Repositorios remotos de la entrega

Un repositorio local existe en esta computadora. Un repositorio remoto es su copia alojada en un servicio Git (por ejemplo GitHub) y tiene una URL compartible para que el docente pueda revisar código, historial y documentación. Un enlace a la aplicación web no sustituye la URL del repositorio.

Se prepararon tres repositorios Git locales independientes, en la rama `main`:

| Repositorio | Contenido |
|---|---|
| `ecclesia-proyecto` | Aplicación, migraciones, semillas, pruebas y documentación del caso |
| `ecclesia-arnes` | Reglas, prompts, checklists, módulo de referencia y hook reutilizable |
| `ecclesia-portabilidad-prueba` | Proyecto ajeno a Ecclesia donde se instaló y ejecutó el arnés |

Al 1 de noviembre de 2026 ninguno tiene `origin`; por eso no se afirma que ya estén publicados. Antes de enviar el trabajo, crear tres repositorios vacíos en la cuenta Git elegida y registrar cada URL en su carpeta correspondiente:

```powershell
cd ecclesia-proyecto
git remote add origin https://github.com/USUARIO/ecclesia-proyecto.git
git push -u origin main
```

Repetir en `ecclesia-arnes` y `ecclesia-portabilidad-prueba` con sus propias URL. Comprobar con `git remote -v` y abrir los tres enlaces en un navegador. Antes del primer `push`, revisar `git status`, crear los commits faltantes y confirmar que `.env`, bases de datos y secretos no estén incluidos. El video MP4 se entrega como archivo separado.
