"""
Pruebas manuales para el endpoint de exportación CSV del historial de cuentas
Fecha: 18 de mayo de 2025
"""

# Prueba 1: Exportar todo el historial sin filtros
# URL: http://localhost:8000/api/cuentas/exportar/
# Método: GET
# Headers: Authorization: Bearer <tu_token>
# Resultado esperado: Archivo CSV con todas las cuentas

# Prueba 2: Exportar historial filtrado por fechas
# URL: http://localhost:8000/api/cuentas/exportar/?fecha_desde=2025-01-01&fecha_hasta=2025-05-18
# Método: GET
# Headers: Authorization: Bearer <tu_token>
# Resultado esperado: Archivo CSV con cuentas del periodo indicado

# Prueba 3: Exportar historial filtrado por categoría
# URL: http://localhost:8000/api/cuentas/exportar/?categoria=servicios
# Método: GET
# Headers: Authorization: Bearer <tu_token>
# Resultado esperado: Archivo CSV con cuentas de la categoría "servicios"

# Prueba 4: Exportar historial filtrado por estado
# URL: http://localhost:8000/api/cuentas/exportar/?estado=pagada
# Método: GET
# Headers: Authorization: Bearer <tu_token>
# Resultado esperado: Archivo CSV sólo con cuentas pagadas

# Prueba 5: Exportar historial con múltiples filtros
# URL: http://localhost:8000/api/cuentas/exportar/?fecha_desde=2025-01-01&fecha_hasta=2025-05-18&categoria=servicios&estado=pendiente
# Método: GET
# Headers: Authorization: Bearer <tu_token>
# Resultado esperado: Archivo CSV con cuentas de servicios pendientes de pago del periodo indicado

"""
Para ejecutar estas pruebas, puedes usar herramientas como:
1. curl desde la línea de comandos
2. Postman o Insomnia como clientes REST gráficos
3. El navegador directamente (para las pruebas GET)

Ejemplo con curl:
curl -H "Authorization: Bearer <tu_token>" http://localhost:8000/api/cuentas/exportar/ > historial.csv

Recuerda reemplazar <tu_token> por un token de acceso válido.
"""
