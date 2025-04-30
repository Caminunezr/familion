# Familion

Familion es una aplicación de gestión familiar.

## Tecnologías principales

*   **Frontend:** React + Electron
*   **Backend:** Django + Django REST Framework
*   **Base de Datos:** SQLite (por defecto, puedes usar PostgreSQL)
*   **Autenticación:** JWT (Django SimpleJWT)

## Instalación

1.  Clona el repositorio
2.  Instala las dependencias de frontend y backend
3.  Configura el backend Django (ver instrucciones en la carpeta backend/)
4.  Ejecuta el backend y el frontend

### Notas sobre almacenamiento local

- Los archivos (facturas, comprobantes) se almacenan localmente en la carpeta `archivosFamilia/`.
- La metadata de los archivos se gestiona con **LokiJS** y se persiste en `archivosFamilia/familia-loki.json`.
- Ya **no se utiliza SQLite ni better-sqlite3**. Puedes eliminar esas dependencias si existen:
  ```bash
  npm uninstall better-sqlite3 sqlite3
  ```
- LokiJS no requiere binarios nativos ni recompilación para diferentes versiones de Node/Electron.

<!-- ... (resto del README) ... -->
