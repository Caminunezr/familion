import axios from 'axios';

// Cambia aquí la URL base a la del backend
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

// Presupuestos
export const getPresupuestos = (params) => axios.get(`${API_BASE}/presupuestos/`, { params });
export const getPresupuesto = (id) => axios.get(`${API_BASE}/presupuestos/${id}/`);
export const createPresupuesto = (data) => axios.post(`${API_BASE}/presupuestos/`, data);
export const updatePresupuesto = (id, data) => axios.put(`${API_BASE}/presupuestos/${id}/`, data);
export const deletePresupuesto = (id) => axios.delete(`${API_BASE}/presupuestos/${id}/`);

// Aportes
export const getAportes = (params) => axios.get(`${API_BASE}/aportes/`, { params });
export const createAporte = (data) => axios.post(`${API_BASE}/aportes/`, data);
export const updateAporte = (id, data) => axios.put(`${API_BASE}/aportes/${id}/`, data);
export const deleteAporte = (id) => axios.delete(`${API_BASE}/aportes/${id}/`);

// Gastos
export const getGastos = (params) => axios.get(`${API_BASE}/gastos-presupuesto/`, { params });
export const createGasto = (data) => axios.post(`${API_BASE}/gastos-presupuesto/`, data);
export const updateGasto = (id, data) => axios.put(`${API_BASE}/gastos-presupuesto/${id}/`, data);
export const deleteGasto = (id) => axios.delete(`${API_BASE}/gastos-presupuesto/${id}/`);

// Deudas
export const getDeudas = (params) => axios.get(`${API_BASE}/deudas-presupuesto/`, { params });
export const createDeuda = (data) => axios.post(`${API_BASE}/deudas-presupuesto/`, data);
export const updateDeuda = (id, data) => axios.put(`${API_BASE}/deudas-presupuesto/${id}/`, data);
export const deleteDeuda = (id) => axios.delete(`${API_BASE}/deudas-presupuesto/${id}/`);

// Ahorros
export const getAhorros = (params) => axios.get(`${API_BASE}/ahorros-presupuesto/`, { params });
export const createAhorro = (data) => axios.post(`${API_BASE}/ahorros-presupuesto/`, data);
export const updateAhorro = (id, data) => axios.put(`${API_BASE}/ahorros-presupuesto/${id}/`, data);
export const deleteAhorro = (id) => axios.delete(`${API_BASE}/ahorros-presupuesto/${id}/`);

// Movimientos
export const getMovimientos = (params) => axios.get(`${API_BASE}/movimientos-presupuesto/`, { params });

// Transferir sobrante
export const transferirSobrante = (presupuestoId) => axios.post(`${API_BASE}/presupuesto/${presupuestoId}/transferir-sobrante/`);

// Cerrar mes
export const cerrarMes = (presupuestoId) => axios.post(`${API_BASE}/presupuesto/${presupuestoId}/cerrar-mes/`);
