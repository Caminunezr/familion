# Documentación del Módulo de Historial Mejorado de Familion

## Visión general

El módulo de historial en Familion permite a los usuarios visualizar, filtrar y exportar información histórica de las cuentas y pagos familiares. Este módulo ha sido rediseñado para mejorar la experiencia de usuario, optimizar el rendimiento y añadir funcionalidades avanzadas.

## Características principales

- **Vista de listado**: Muestra las cuentas en formato tabular con opciones de ordenación.
- **Vista de detalles**: Permite ver información detallada de cada cuenta y sus pagos asociados.
- **Filtrado avanzado**: Filtros por fecha, categoría, estado y otros criterios.
- **Agrupación**: Visualización agrupada por mes, categoría o proveedor.
- **Gráficos**: Visualización gráfica de los datos para análisis.
- **Comparativas**: Análisis comparativo entre períodos seleccionados.
- **Exportación CSV**: Exportación del historial a formato CSV con los filtros aplicados.

## Estructura de archivos

### Frontend (React)

- `src/components/historial/Historial.js`: Componente principal
- `src/components/historial/HistorialListado.js`: Vista de listado
- `src/components/historial/HistorialDetalles.js`: Vista de detalles
- `src/components/historial/HistorialGraficos.js`: Visualizaciones gráficas
- `src/components/historial/HistorialFiltros.js`: Componente de filtros
- `src/components/historial/HistorialComparativa.js`: Comparativa entre períodos
- `src/components/historial/hooks/useHistorialData.js`: Hook personalizado para manejo de datos

### Servicios y Utilidades

- `src/services/historial.js`: Servicios para interactuar con la API
- `src/utils/historialUtils.js`: Funciones de utilidad para procesamiento de datos

### Backend (Django)

- `backend/api/views.py`: Contiene los endpoints para el historial
- `backend/api/urls.py`: Rutas de la API

## API Endpoints

### GET `/api/cuentas/`

Obtiene la lista de cuentas con posibilidad de filtrado.

**Parámetros:**
- `fecha_desde`: Fecha de inicio (YYYY-MM-DD)
- `fecha_hasta`: Fecha de fin (YYYY-MM-DD)
- `categoria`: Categoría de la cuenta
- `estado`: Estado de la cuenta ('pagada' o 'pendiente')

### GET `/api/pagos/?cuenta={id}`

Obtiene los pagos asociados a una cuenta específica.

**Parámetros:**
- `cuenta`: ID de la cuenta

### GET `/api/cuentas/exportar/`

Exporta las cuentas a formato CSV, aplicando los mismos filtros disponibles para la consulta.

**Parámetros:**
- `fecha_desde`: Fecha de inicio (YYYY-MM-DD)
- `fecha_hasta`: Fecha de fin (YYYY-MM-DD)
- `categoria`: Categoría de la cuenta
- `estado`: Estado de la cuenta ('pagada' o 'pendiente')

**Respuesta:**
Archivo CSV con los siguientes campos:
- ID
- Nombre
- Monto
- Proveedor
- Categoría
- Fecha Emisión
- Fecha Vencimiento
- Descripción
- Creador
- Fecha Creación
- Estado
- Monto Pagado
- Fecha Último Pago

## Guía de uso para la exportación de datos

1. **Desde la interfaz de Historial:**
   - Aplica los filtros deseados (fecha, categoría, estado)
   - Haz clic en el botón "Exportar a CSV"
   - El archivo se descargará automáticamente

2. **Directamente desde la API:**
   - Realiza una petición GET a `/api/cuentas/exportar/` con los parámetros de filtrado
   - Asegúrate de incluir el token de autenticación
   - Guarda la respuesta como archivo CSV

## Notas para desarrolladores

- La exportación CSV es intensiva en recursos para grandes conjuntos de datos.
- La función utiliza `select_related` para optimizar las consultas a la base de datos.
- Los cálculos de estado y montos pagados se realizan en el servidor.
