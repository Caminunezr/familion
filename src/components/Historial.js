import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import db from '../utils/database';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './Historial.css';

// Registrar los componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Historial = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [historialCuentas, setHistorialCuentas] = useState([]);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(() => {
    // Por defecto, 6 meses atrás
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 6);
    return fechaInicio.toISOString().split('T')[0];
  });
  const [filtroFechaFin, setFiltroFechaFin] = useState(() => {
    // Por defecto, hoy
    return new Date().toISOString().split('T')[0];
  });
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [agrupacion, setAgrupacion] = useState('mes'); // mes, trimestre, año
  const [categorias, setCategorias] = useState([]);
  const [datosAgrupados, setDatosAgrupados] = useState({
    porPeriodo: [],
    porCategoria: []
  });
  const [mostrarDetalle, setMostrarDetalle] = useState(null);

  // Agrupar datos para visualización en gráficos (ahora es memoizada con useCallback)
  const agruparDatos = useCallback((cuentas) => {
    // Para agrupar por período (mes, trimestre, año)
    const porPeriodo = {};
    // Para agrupar por categoría
    const porCategoria = {};

    cuentas.forEach(cuenta => {
      const fecha = new Date(cuenta.fechaCreacion);

      // Agrupar por período seleccionado
      let periodoKey;
      if (agrupacion === 'mes') {
        periodoKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (agrupacion === 'trimestre') {
        const trimestre = Math.floor(fecha.getMonth() / 3) + 1;
        periodoKey = `${fecha.getFullYear()}-T${trimestre}`;
      } else { // año
        periodoKey = fecha.getFullYear().toString();
      }

      // Inicializar si no existe
      if (!porPeriodo[periodoKey]) {
        porPeriodo[periodoKey] = {
          total: 0,
          pagadas: 0,
          pendientes: 0,
          cantidad: 0
        };
      }

      // Sumar al período
      porPeriodo[periodoKey].total += cuenta.monto;
      porPeriodo[periodoKey].cantidad += 1;
      if (cuenta.estaPagada) {
        porPeriodo[periodoKey].pagadas += cuenta.monto;
      } else {
        porPeriodo[periodoKey].pendientes += cuenta.monto;
      }

      // Agrupar por categoría
      const categoriaKey = cuenta.categoria || 'Sin categoría';
      if (!porCategoria[categoriaKey]) {
        porCategoria[categoriaKey] = 0;
      }
      porCategoria[categoriaKey] += cuenta.monto;
    });

    // Convertir a arrays para los gráficos
    const periodosArray = Object.entries(porPeriodo)
      .map(([periodo, datos]) => ({
        periodo,
        ...datos
      }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));

    const categoriasArray = Object.entries(porCategoria)
      .map(([categoria, monto]) => ({
        categoria,
        monto
      }))
      .sort((a, b) => b.monto - a.monto);

    setDatosAgrupados({
      porPeriodo: periodosArray,
      porCategoria: categoriasArray
    });
  }, [agrupacion]); // Agregar agrupacion como dependencia

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      // Obtener todas las categorías
      const categoriasData = await db.categorias.toArray();
      setCategorias(categoriasData);

      // Obtener historial de cuentas
      let cuentasHistoricas = await db.cuentas
        .where('userId')
        .equals(currentUser.uid)
        .toArray();

      // Filtrar por fecha
      cuentasHistoricas = cuentasHistoricas.filter(cuenta => {
        const fechaCuenta = new Date(cuenta.fechaCreacion);
        const inicio = new Date(filtroFechaInicio);
        const fin = new Date(filtroFechaFin);
        fin.setHours(23, 59, 59);
        return fechaCuenta >= inicio && fechaCuenta <= fin;
      });

      // Filtrar por categoría
      if (filtroCategoria !== 'todas') {
        cuentasHistoricas = cuentasHistoricas.filter(cuenta => 
          cuenta.categoria === filtroCategoria
        );
      }

      // Filtrar por estado
      if (filtroEstado !== 'todos') {
        const estaPagada = filtroEstado === 'pagadas';
        cuentasHistoricas = cuentasHistoricas.filter(cuenta => 
          cuenta.estaPagada === estaPagada
        );
      }

      // Ordenar por fecha (más recientes primero)
      cuentasHistoricas.sort((a, b) => 
        new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
      );

      setHistorialCuentas(cuentasHistoricas);

      // Agrupar datos para gráficos
      agruparDatos(cuentasHistoricas);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.uid, filtroFechaInicio, filtroFechaFin, filtroCategoria, filtroEstado, agruparDatos]); // Añadir agruparDatos como dependencia

  // Efecto para cargar datos iniciales y cuando cambian los filtros
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Formatear números como moneda (CLP)
  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  // Formatear fecha
  const formatFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear período según la agrupación seleccionada
  const formatPeriodo = (periodo) => {
    if (agrupacion === 'mes') {
      const [año, mes] = periodo.split('-');
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${nombresMeses[parseInt(mes) - 1]} ${año}`;
    } else if (agrupacion === 'trimestre') {
      const [año, trimestre] = periodo.split('-T');
      return `Trimestre ${trimestre}, ${año}`;
    } else {
      return `Año ${periodo}`;
    }
  };

  // Datos para el gráfico de línea (tendencia por período)
  const lineChartData = {
    labels: datosAgrupados.porPeriodo.map(p => formatPeriodo(p.periodo)),
    datasets: [
      {
        label: 'Total',
        data: datosAgrupados.porPeriodo.map(p => p.total),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3
      },
      {
        label: 'Pagadas',
        data: datosAgrupados.porPeriodo.map(p => p.pagadas),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3
      },
      {
        label: 'Pendientes',
        data: datosAgrupados.porPeriodo.map(p => p.pendientes),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3
      }
    ]
  };

  // Datos para el gráfico de barras (distribución por categoría)
  const barChartData = {
    labels: datosAgrupados.porCategoria.map(c => c.categoria),
    datasets: [
      {
        label: 'Monto por Categoría',
        data: datosAgrupados.porCategoria.map(c => c.monto),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Opciones para los gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatMonto(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatMonto(value)
        }
      }
    }
  };

  return (
    <div className="historial-page">
      <NavBar />
      
      <div className="historial-container">
        <div className="historial-header">
          <h2>Historial de Cuentas</h2>
        </div>
        
        {/* Sección de filtros */}
        <div className="filtros-container">
          <h3>Filtros</h3>
          <div className="filtros-grid">
            <div className="filtro-group">
              <label htmlFor="fecha-inicio">Desde:</label>
              <input
                type="date"
                id="fecha-inicio"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
              />
            </div>
            
            <div className="filtro-group">
              <label htmlFor="fecha-fin">Hasta:</label>
              <input
                type="date"
                id="fecha-fin"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
              />
            </div>
            
            <div className="filtro-group">
              <label htmlFor="categoria">Categoría:</label>
              <select
                id="categoria"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </select>
            </div>
            
            <div className="filtro-group">
              <label htmlFor="estado">Estado:</label>
              <select
                id="estado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="pagadas">Pagadas</option>
                <option value="pendientes">Pendientes</option>
              </select>
            </div>
          </div>
          
          <div className="agrupacion-container">
            <span>Agrupar por:</span>
            <div className="agrupacion-buttons">
              <button
                className={agrupacion === 'mes' ? 'active' : ''}
                onClick={() => setAgrupacion('mes')}
              >
                Mes
              </button>
              <button
                className={agrupacion === 'trimestre' ? 'active' : ''}
                onClick={() => setAgrupacion('trimestre')}
              >
                Trimestre
              </button>
              <button
                className={agrupacion === 'año' ? 'active' : ''}
                onClick={() => setAgrupacion('año')}
              >
                Año
              </button>
            </div>
          </div>
        </div>
        
        {/* Contenido principal del historial */}
        <div className="historial-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando historial...</p>
            </div>
          ) : (
            <>
              {/* Resumen estadístico */}
              <div className="resumen-estadistico">
                <h3>Resumen</h3>
                <div className="resumen-cards">
                  <div className="resumen-card">
                    <div className="resumen-icon">📊</div>
                    <div className="resumen-content">
                      <div className="resumen-valor">{historialCuentas.length}</div>
                      <div className="resumen-label">Cuentas totales</div>
                    </div>
                  </div>
                  
                  <div className="resumen-card">
                    <div className="resumen-icon">💰</div>
                    <div className="resumen-content">
                      <div className="resumen-valor">
                        {formatMonto(historialCuentas.reduce((sum, cuenta) => sum + cuenta.monto, 0))}
                      </div>
                      <div className="resumen-label">Valor total</div>
                    </div>
                  </div>
                  
                  <div className="resumen-card">
                    <div className="resumen-icon">✅</div>
                    <div className="resumen-content">
                      <div className="resumen-valor">
                        {historialCuentas.filter(c => c.estaPagada).length}
                      </div>
                      <div className="resumen-label">Cuentas pagadas</div>
                    </div>
                  </div>
                  
                  <div className="resumen-card">
                    <div className="resumen-icon">⏳</div>
                    <div className="resumen-content">
                      <div className="resumen-valor">
                        {historialCuentas.filter(c => !c.estaPagada).length}
                      </div>
                      <div className="resumen-label">Cuentas pendientes</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Gráficos de visualización */}
              <div className="graficos-container">
                <div className="grafico-card tendencia">
                  <h3>Tendencia por Período</h3>
                  <div className="grafico-wrapper">
                    <Line data={lineChartData} options={chartOptions} />
                  </div>
                </div>
                
                <div className="grafico-card distribucion">
                  <h3>Distribución por Categoría</h3>
                  <div className="grafico-wrapper">
                    <Bar data={barChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
              
              {/* Lista de períodos - Versión rediseñada */}
              <div className="periodos-container">
                <h3>Períodos</h3>
                {datosAgrupados.porPeriodo.length === 0 ? (
                  <div className="empty-periodos">
                    <p>No hay datos para los filtros seleccionados</p>
                  </div>
                ) : (
                  <div className="periodos-grid">
                    {datosAgrupados.porPeriodo.map((periodo, index) => {
                      // Calcular porcentajes para estilos
                      const porcentajePagado = periodo.total > 0 ? (periodo.pagadas / periodo.total) * 100 : 0;
                      const porcentajePendiente = periodo.total > 0 ? (periodo.pendientes / periodo.total) * 100 : 0;
                      
                      return (
                        <div 
                          key={index} 
                          className="periodo-card"
                          style={{
                            borderLeftColor: periodo.pendientes > periodo.pagadas ? '#F44336' : '#4CAF50'
                          }}
                          onClick={() => setMostrarDetalle(periodo.periodo === mostrarDetalle ? null : periodo.periodo)}
                        >
                          <div className="periodo-header">
                            <h4>{formatPeriodo(periodo.periodo)}</h4>
                            <span className="periodo-total">{formatMonto(periodo.total)}</span>
                          </div>
                          
                          <div className="periodo-stats">
                            <div className="stat-item">
                              <span className="stat-label">Cuentas:</span>
                              <span className="stat-value">{periodo.cantidad}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Pagadas:</span>
                              <span className="stat-value pagadas">{formatMonto(periodo.pagadas)}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Pendientes:</span>
                              <span className="stat-value pendientes">{formatMonto(periodo.pendientes)}</span>
                            </div>
                          </div>
                          
                          <div className="periodo-progress">
                            <div 
                              className="progress-bar pagadas"
                              style={{ width: `${porcentajePagado}%` }}
                            ></div>
                            <div 
                              className="progress-bar pendientes"
                              style={{ width: `${porcentajePendiente}%` }}
                            ></div>
                          </div>
                          
                          <div className="periodo-detalle-toggle">
                            {mostrarDetalle === periodo.periodo ? 'Ocultar detalles ▲' : 'Ver detalles ▼'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Tabla detallada de cuentas */}
              {mostrarDetalle && (
                <div className="detalle-periodo">
                  <h3>Detalle: {formatPeriodo(mostrarDetalle)}</h3>
                  <div className="tabla-container">
                    <table className="tabla-cuentas">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Cuenta</th>
                          <th>Categoría</th>
                          <th>Monto</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialCuentas
                          .filter(cuenta => {
                            const fecha = new Date(cuenta.fechaCreacion);
                            let periodoKey;
                            
                            if (agrupacion === 'mes') {
                              periodoKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
                            } else if (agrupacion === 'trimestre') {
                              const trimestre = Math.floor(fecha.getMonth() / 3) + 1;
                              periodoKey = `${fecha.getFullYear()}-T${trimestre}`;
                            } else { // año
                              periodoKey = fecha.getFullYear().toString();
                            }
                            
                            return periodoKey === mostrarDetalle;
                          })
                          .map(cuenta => (
                            <tr key={cuenta.id} className={cuenta.estaPagada ? 'pagada' : 'pendiente'}>
                              <td>{formatFecha(cuenta.fechaCreacion)}</td>
                              <td>{cuenta.nombre}</td>
                              <td>{cuenta.categoria || 'Sin categoría'}</td>
                              <td className="monto">{formatMonto(cuenta.monto)}</td>
                              <td>
                                <span className={`estado-badge ${cuenta.estaPagada ? 'pagada' : 'pendiente'}`}>
                                  {cuenta.estaPagada ? 'Pagada' : 'Pendiente'}
                                </span>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Historial;
