import React, { useState, useEffect, useMemo } from 'react';
// Actualizar ruta para NavBar (subir un nivel)
import NavBar from '../NavBar';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
// Actualizar ruta para db (subir dos niveles)
import db from '../../utils/database';
// Actualizar ruta para historialUtils (subir dos niveles)
import { procesarCuentasYPagosHistorial, filtrarCuentasHistorial, agruparDatosHistorial } from '../../utils/historialUtils';
// Las importaciones de subcomponentes ahora están en la misma carpeta (usar ./)
import HistorialFiltros from './HistorialFiltros';
import HistorialResumen from './HistorialResumen';
import HistorialGraficos from './HistorialGraficos';
import HistorialInterpretacion from './HistorialInterpretacion';
import HistorialPeriodos from './HistorialPeriodos';
// Importar CSS desde la misma carpeta
import './Historial.css';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const formatoMes = (periodoStr) => {
  if (!periodoStr) return '';
  const [año, mes] = periodoStr.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(mes) - 1]} ${año}`;
};

const Historial = () => {
  // Estados de carga y datos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Estados de filtrado
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [agrupacion, setAgrupacion] = useState('mes');

  // Estados de visualización
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [datosAgrupados, setDatosAgrupados] = useState({
    porMes: [],
    porCategoria: [],
    porPeriodo: []
  });

  // Inicializar fechas de filtro por defecto
  useEffect(() => {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 6);
    setFiltroFechaInicio(fechaInicio.toISOString().split('T')[0]);
    setFiltroFechaFin(fechaFin.toISOString().split('T')[0]);
  }, []);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Iniciando carga de datos del historial...");

        await db.categorias.toArray();
        const categoriasValidasNombres = ['Luz', 'Agua', 'Gas', 'Internet', 'Utiles de Aseo', 'Otros'];
        const categoriasUnicas = categoriasValidasNombres.map(nombre => ({
          id: nombre,
          nombre: nombre
        }));
        setCategorias(categoriasUnicas);
        console.log("Categorías procesadas:", categoriasUnicas);

        const [cuentasArray] = await Promise.all([
          db.cuentas.toArray()
        ]);
        const pagosArray = [];

        console.log("Cuentas cargadas:", cuentasArray.length);

        const cuentasProcesadas = procesarCuentasYPagosHistorial(cuentasArray, pagosArray);
        console.log("Cuentas procesadas:", cuentasProcesadas.length);

        const filtros = { filtroFechaInicio, filtroFechaFin, filtroCategoria, filtroEstado };
        const cuentasFiltradas = filtrarCuentasHistorial(cuentasProcesadas, filtros);
        console.log("Cuentas filtradas:", cuentasFiltradas.length);
        setCuentas(cuentasFiltradas);

        const agrupados = agruparDatosHistorial(cuentasFiltradas, agrupacion, formatoMes);
        setDatosAgrupados(agrupados);

        console.log("Carga de datos completada con éxito");
      } catch (error) {
        console.error('Error al cargar datos del historial:', error);
        setError('No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [filtroFechaInicio, filtroFechaFin, filtroCategoria, filtroEstado, agrupacion, refreshCounter]);

  const datosPorCategoria = useMemo(() => {
    if (!datosAgrupados.porCategoria || datosAgrupados.porCategoria.length === 0) {
      return {};
    }
    const colores = {
      'Luz': '#f39c12',
      'Agua': '#3498db',
      'Gas': '#e74c3c',
      'Internet': '#9b59b6',
      'Utiles de Aseo': '#2ecc71',
      'Otros': '#95a5a6',
      'Sin categoría': '#7f8c8d'
    };
    return {
      labels: datosAgrupados.porCategoria.map(cat => cat.categoria),
      datasets: [{
        data: datosAgrupados.porCategoria.map(cat => cat.totalMonto),
        backgroundColor: datosAgrupados.porCategoria.map(cat => colores[cat.categoria] || '#999'),
        borderWidth: 1
      }]
    };
  }, [datosAgrupados.porCategoria]);

  const datosTendencias = useMemo(() => {
    if (!datosAgrupados.porMes || datosAgrupados.porMes.length < 2) {
      return {};
    }
    const mesesRecientes = [...datosAgrupados.porMes].reverse().slice(0, 6).reverse();

    return {
      labels: mesesRecientes.map(mes => mes.etiqueta),
      datasets: [{
        label: 'Monto Total',
        data: mesesRecientes.map(mes => mes.totalMonto),
        backgroundColor: 'rgba(52, 152, 219, 0.7)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1
      }, {
        label: 'Monto Pagado',
        data: mesesRecientes.map(mes => mes.montoPagado),
        backgroundColor: 'rgba(46, 204, 113, 0.7)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1
      }]
    };
  }, [datosAgrupados.porMes]);

  const resumenGeneral = useMemo(() => {
    const totalCuentas = cuentas.length;
    const totalMonto = cuentas.reduce((sum, cuenta) => sum + (parseFloat(cuenta.monto) || 0), 0);
    const totalPagado = cuentas.reduce((sum, cuenta) => sum + (parseFloat(cuenta.totalPagado) || 0), 0);
    const cuentasPagadas = cuentas.filter(cuenta => cuenta.estaPagada).length;

    return {
      totalCuentas,
      totalMonto,
      totalPagado,
      cuentasPagadas,
      porcentajePagado: totalMonto > 0 ? Math.round((totalPagado / totalMonto) * 100) : 0
    };
  }, [cuentas]);

  const seleccionarPeriodo = (periodo) => {
    if (periodoSeleccionado === periodo) {
      setPeriodoSeleccionado(null);
    } else {
      setPeriodoSeleccionado(periodo);
    }
  };

  const formatoFecha = (fechaStr) => {
    if (!fechaStr) return 'Sin fecha';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES');
  };

  const formatMonto = (monto) => {
    return monto ? `$${monto.toLocaleString('es-CL')}` : '$0';
  };

  const exportarCSV = () => {
    const cabeceras = ['Nombre', 'Categoría', 'Monto', 'Pagado', '% Pagado', 'Vencimiento', 'Estado'];
    const filas = cuentas.map(cuenta => [
      cuenta.nombre,
      cuenta.categoria,
      cuenta.monto,
      cuenta.totalPagado || 0,
      `${cuenta.porcentajePagado}%`,
      cuenta.fechaVencimiento ? formatoFecha(cuenta.fechaVencimiento) : 'Sin fecha',
      cuenta.estaPagada ? 'Pagada' : 'Pendiente'
    ]);

    const contenidoCSV = [
      cabeceras.join(','),
      ...filas.map(fila => fila.join(','))
    ].join('\n');

    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_cuentas_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterChange = (name, value) => {
    switch (name) {
      case 'filtroFechaInicio':
        setFiltroFechaInicio(value);
        break;
      case 'filtroFechaFin':
        setFiltroFechaFin(value);
        break;
      case 'filtroCategoria':
        setFiltroCategoria(value);
        break;
      case 'filtroEstado':
        setFiltroEstado(value);
        break;
      default:
        break;
    }
  };

  const resetFilters = () => {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 6);
    setFiltroFechaInicio(fechaInicio.toISOString().split('T')[0]);
    setFiltroFechaFin(fechaFin.toISOString().split('T')[0]);
    setFiltroCategoria('todas');
    setFiltroEstado('todos');
  };

  return (
    <div className="historial-page">
      <NavBar />
      <div className="historial-container">
        <div className="historial-header">
          <h2>Historial de Cuentas</h2>
          <button
            className="refresh-button"
            onClick={() => setRefreshCounter(prev => prev + 1)}
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar datos'}
          </button>
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button
              className="retry-button"
              onClick={() => setRefreshCounter(prev => prev + 1)}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="historial-content">
            <HistorialFiltros
              filtros={{ filtroFechaInicio, filtroFechaFin, filtroCategoria, filtroEstado }}
              categorias={categorias}
              agrupacion={agrupacion}
              onFilterChange={handleFilterChange}
              onAgrupacionChange={setAgrupacion}
              onExport={exportarCSV}
            />
            <HistorialResumen
              resumenGeneral={resumenGeneral}
              formatMonto={formatMonto}
            />
            <HistorialGraficos
              datosPorCategoria={datosPorCategoria}
              datosTendencias={datosTendencias}
            />
            <HistorialInterpretacion
              resumenGeneral={resumenGeneral}
              datosAgrupados={datosAgrupados}
              formatMonto={formatMonto}
            />
            <HistorialPeriodos
              datosAgrupados={datosAgrupados}
              agrupacion={agrupacion}
              periodoSeleccionado={periodoSeleccionado}
              seleccionarPeriodo={seleccionarPeriodo}
              formatMonto={formatMonto}
              formatoFecha={formatoFecha}
              onResetFilters={resetFilters}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;
