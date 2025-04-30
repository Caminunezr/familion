import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';
import ResumenCards from './ResumenCards';
import DashboardGraficos from './DashboardGraficos';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [resumenFinanciero, setResumenFinanciero] = useState({
    totalPendiente: 0,
    totalPagado: 0,
    presupuestoTotal: 0,
    progreso: 0,
    tendencia: 0
  });
  const [cuentasPendientes, setCuentasPendientes] = useState([]);
  const [datosPorCategoria, setDatosPorCategoria] = useState({ labels: [], datasets: [] });
  const [comparativaMeses, setComparativaMeses] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access');
        if (!token) {
          setError('No autenticado.');
          setLoading(false);
          return;
        }
        // Obtener cuentas
        const cuentasRes = await fetch('http://localhost:8000/api/cuentas/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!cuentasRes.ok) throw new Error('Error al obtener cuentas');
        const cuentasData = await cuentasRes.json();
        setCuentas(cuentasData);
        // Obtener pagos
        const pagosRes = await fetch('http://localhost:8000/api/pagos/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!pagosRes.ok) throw new Error('Error al obtener pagos');
        const pagosData = await pagosRes.json();
        setPagos(pagosData);
        // Procesar datos para resumen
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1;
        const añoActual = hoy.getFullYear();
        // Cuentas pendientes y pagadas
        const pendientes = cuentasData.filter(c => {
          const totalPagado = pagosData.filter(p => p.cuenta === c.id).reduce((sum, p) => sum + Number(p.monto), 0);
          return totalPagado < Number(c.monto);
        });
        setCuentasPendientes(pendientes);
        // Resumen financiero
        const totalPendiente = pendientes.reduce((sum, c) => sum + Number(c.monto), 0);
        const totalPagado = pagosData.reduce((sum, p) => sum + Number(p.monto), 0);
        setResumenFinanciero({
          totalPendiente,
          totalPagado,
          presupuestoTotal: 0, // Puedes adaptar si tienes presupuesto en tu modelo
          progreso: 0,
          tendencia: 0
        });
        // Datos por categoría (ejemplo)
        const gastosPorCategoria = {};
        cuentasData.forEach(c => {
          const cat = c.categoria || 'Sin Categoría';
          gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + Number(c.monto);
        });
        setDatosPorCategoria({
          labels: Object.keys(gastosPorCategoria),
          datasets: [{
            data: Object.values(gastosPorCategoria),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
          }]
        });
        // Comparativa meses (ejemplo simple)
        setComparativaMeses({
          labels: ['Mes Actual'],
          datasets: [{
            label: 'Cuentas',
            data: [cuentasData.length],
            backgroundColor: ['#FFCE56'],
          }]
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="dashboard-loading"><span className="loading-spinner"></span> Cargando...</div>;
  }
  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="dashboard-page">
      <NavBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
        </div>
        <div className="dashboard-content">
          <ResumenCards resumenFinanciero={resumenFinanciero} cuentasPendientes={cuentasPendientes} />
          <DashboardGraficos datosPorCategoria={datosPorCategoria} comparativaMeses={comparativaMeses} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
