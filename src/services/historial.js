// src/services/historial.js

export async function obtenerHistorialCuentas(filtros = {}) {
  const token = localStorage.getItem('access');
  if (!token) throw new Error('No autenticado');

  // Construir los parámetros de consulta basados en los filtros
  const params = new URLSearchParams();
  if (filtros.fechaInicio) params.append('fecha_desde', filtros.fechaInicio);
  if (filtros.fechaFin) params.append('fecha_hasta', filtros.fechaFin);
  if (filtros.categoria && filtros.categoria !== 'todas') params.append('categoria', filtros.categoria);
  if (filtros.estado && filtros.estado !== 'todos') {
    params.append('estado', filtros.estado === 'pagadas' ? 'pagada' : 'pendiente');
  }

  const url = `http://localhost:8000/api/cuentas/?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener datos de historial');
  
  return response.json();
}

export async function obtenerPagosPorCuenta(cuentaId) {
  const token = localStorage.getItem('access');
  if (!token) throw new Error('No autenticado');
  
  const url = `http://localhost:8000/api/pagos/?cuenta=${cuentaId}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener pagos');
  
  return response.json();
}

export async function obtenerCategorias() {
  const token = localStorage.getItem('access');
  if (!token) throw new Error('No autenticado');
  
  // Obtendremos categorías únicas de la API
  const response = await fetch('http://localhost:8000/api/cuentas/', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener categorías');
  
  const cuentas = await response.json();
  const categorias = [...new Set(cuentas.map(cuenta => cuenta.categoria))].filter(Boolean);
  
  return categorias.map(cat => ({ id: cat, nombre: cat }));
}

export async function exportarHistorialCSV(filtros = {}) {
  const token = localStorage.getItem('access');
  if (!token) throw new Error('No autenticado');
  
  // Construir parámetros como en obtenerHistorialCuentas
  const params = new URLSearchParams();
  if (filtros.fechaInicio) params.append('fecha_desde', filtros.fechaInicio);
  if (filtros.fechaFin) params.append('fecha_hasta', filtros.fechaFin);
  if (filtros.categoria && filtros.categoria !== 'todas') params.append('categoria', filtros.categoria);
  if (filtros.estado && filtros.estado !== 'todos') {
    params.append('estado', filtros.estado === 'pagadas' ? 'pagada' : 'pendiente');
  }
  
  // Endpoint para exportar (a implementar en el backend)
  const url = `http://localhost:8000/api/cuentas/exportar/?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al exportar datos');
  
  const blob = await response.blob();
  
  // Crear y descargar archivo
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'historial-cuentas.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
