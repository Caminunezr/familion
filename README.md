# Familion

Bienvenido al Proyecto Familion

Familion es una aplicación de gestión familiar que te permite organizar, visualizar y controlar las finanzas, cuentas y documentos de tu grupo familiar de forma centralizada y segura.

## Características principales

- **Gestión de cuentas y pagos familiares** (luz, agua, arriendo, etc.)
- **Visualización moderna**: línea de tiempo, agrupación por mes/año, filtros y búsqueda
- **Carga y almacenamiento de facturas y comprobantes**
- **Panel de administración y control de usuarios**
- **Historial y reportes**
- **Presupuestos familiares**
- **Autenticación segura con JWT**
- **Soporte multiusuario y grupos familiares**

## Resumen Rápido

- Gestión centralizada de finanzas familiares.
- Visualización avanzada para una mejor organización.
- Almacenamiento seguro de documentos importantes.
- Herramientas de administración y control de usuarios.
- Soporte para múltiples usuarios y grupos.

## Tecnologías utilizadas

- **Frontend:** React + Electron
- **Backend:** Django + Django REST Framework
- **Base de Datos:** SQLite (por defecto, puedes usar PostgreSQL)
- **Autenticación:** JWT (Django SimpleJWT)
- **Almacenamiento de archivos:** Local (carpeta `archivosFamilia/`), metadata con LokiJS

## Instalación rápida

1. **Clona el repositorio**
2. **Instala dependencias**
   - Frontend: `npm install`
   - Backend: `pip install -r requirements.txt` (ver carpeta backend/)
3. **Configura el backend Django**
   - Edita `backend/settings.py` si necesitas cambiar la base de datos o rutas
   - Ejecuta migraciones: `python manage.py migrate`
   - Crea un superusuario: `python manage.py createsuperuser`
4. **Ejecuta el backend**
   - `python manage.py runserver`
5. **Ejecuta el frontend**
   - `npm start` (modo web)
   - `npm run electron:dev` (modo escritorio/Electron)

## Notas sobre almacenamiento local

- Los archivos (facturas, comprobantes) se almacenan en la carpeta `archivosFamilia/`.
- La metadata de los archivos se gestiona con **LokiJS** y se persiste en `archivosFamilia/familia-loki.json`.
- Ya **no se utiliza SQLite ni better-sqlite3** para archivos. Puedes eliminar esas dependencias:
  ```bash
  npm uninstall better-sqlite3 sqlite3
  ```
- LokiJS no requiere binarios nativos ni recompilación para diferentes versiones de Node/Electron.

## Scripts útiles

- `npm start` — Inicia el frontend en modo desarrollo
- `npm run electron:dev` — Inicia la app en modo escritorio (Electron)
- `npm run build` — Compila el frontend para producción
- `python manage.py runserver` — Inicia el backend Django

## Estructura del proyecto

- `src/` — Código fuente del frontend React/Electron
- `backend/` — Código fuente del backend Django
- `archivosFamilia/` — Carpeta local para archivos y metadata

## Licencia

MIT

---

¿Dudas o sugerencias? ¡Contribuciones y feedback son bienvenidos!
