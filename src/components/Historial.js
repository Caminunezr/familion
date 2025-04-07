import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavBar from './NavBar';
import db from '../utils/database';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './Historial.css';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

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
  const [dispositivo, setDispositivo] = useState(window.innerWidth <= 768 ? 'movil' : 'escritorio');
  const [activeTab, setActiveTab] = useState('resumen'); // resumen, tendencias, categorias, periodos

  // Detectar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setDispositivo(window.innerWidth <= 768 ? 'movil' : 'escritorio');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Formatear números como moneda (CLP)
  const formatMonto = useCallback((monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  }, []);

  // Formatear fecha
  const formatFecha = useCallback((fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Formatear período según la agrupación seleccionada
  const formatPeriodo = useCallback((periodo) => {
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
  }, [agrupacion]);

  // Agrupar datos para visualización en gráficos
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
        porCategoria[categoriaKey] = {
          total: 0,
          pagadas: 0,
          pendientes: 0,
          cantidad: 0
        };
      }
      
      porCategoria[categoriaKey].total += cuenta.monto;
      porCategoria[categoriaKey].cantidad += 1;
      if (cuenta.estaPagada) {
        porCategoria[categoriaKey].pagadas += cuenta.monto;
      } else {
        porCategoria[categoriaKey].pendientes += cuenta.monto;
      }
    });

    // Convertir a arrays para los gráficos
    const periodosArray = Object.entries(porPeriodo)
      .map(([periodo, datos]) => ({
        periodo,
        ...datos
      }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));

    const categoriasArray = Object.entries(porCategoria)
      .map(([categoria, datos]) => ({
        categoria,
        ...datos
      }))
      .sort((a, b) => b.total - a.total);

    setDatosAgrupados({
      porPeriodo: periodosArray,
      porCategoria: categoriasArray
    });
  }, [agrupacion]);

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
  }, [currentUser.uid, filtroFechaInicio, filtroFechaFin, filtroCategoria, filtroEstado, agruparDatos]);

  // Efecto para cargar datos iniciales y cuando cambian los filtros
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Exportar datos a CSV
  const exportarCSV = useCallback(() => {
    if (!historialCuentas.length) return;
    
    // Convertir datos a formato CSV
    const headers = ['Nombre,Categoría,Monto,Estado,FechaCreación,FechaVencimiento'];
    const rows = historialCuentas.map(cuenta => [
      `"${cuenta.nombre}"`,
      `"${cuenta.categoria || 'Sin categoría'}"`,
      cuenta.monto,
      cuenta.estaPagada ? 'Pagada' : 'Pendiente',
      `"${formatFecha(cuenta.fechaCreacion)}"`,
      cuenta.fechaVencimiento ? `"${formatFecha(cuenta.fechaVencimiento)}"` : 'N/A'
    ].join(','));
    
    const csvContent = `${headers}\n${rows.join('\n')}`;
    
    // Crear el blob y descargarlo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fecha = new Date().toISOString().slice(0,10);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `historial-cuentas-${fecha}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [historialCuentas, formatFecha]);

  // Datos para el gráfico de línea (tendencia por período)
  const lineChartData = useMemo(() => {
    return {
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
  }, [datosAgrupados.porPeriodo, formatPeriodo]);

  // Datos para el gráfico de barras (distribución por categoría)
  const barChartData = useMemo(() => {
    return {
      labels: datosAgrupados.porCategoria.map(c => c.categoria),
      datasets: [
        {
          label: 'Monto por Categoría',
          data: datosAgrupados.porCategoria.map(c => c.total),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)'
          ],
          borderWidth: 1,
        }
      ]
    };
  }, [datosAgrupados.porCategoria]);

  // Datos para gráfico de donut (pagado vs pendiente)
  const doughnutData = useMemo(() => {
    const totalPagado = historialCuentas.reduce((sum, cuenta) => cuenta.estaPagada ? sum + cuenta.monto : sum, 0);
    const totalPendiente = historialCuentas.reduce((sum, cuenta) => !cuenta.estaPagada ? sum + cuenta.monto : sum, 0);
    
    return {
      labels: ['Pagado', 'Pendiente'],
      datasets: [{
        data: [totalPagado, totalPendiente],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      }]
    };
  }, [historialCuentas]);

  // Opciones para los gráficos
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: dispositivo === 'movil' ? 12 : 15,
            padding: dispositivo === 'movil' ? 8 : 15,
            font: {
              size: dispositivo === 'movil' ? 10 : 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.raw !== undefined) {
                label += formatMonto(context.raw);
              }
              return label;
            }
          }
        }
      },
      scales: dispositivo === 'movil' ? undefined : {
        y: {
          ticks: {
            callback: (value) => formatMonto(value)
          }
        }
      }
    };
  }, [dispositivo, formatMonto]);
  
  // Opciones específicas para gráficos de pastel/dona
  const pieChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: dispositivo === 'movil' ? 12 : 15,
            padding: dispositivo === 'movil' ? 8 : 15,
            font: {
              size: dispositivo === 'movil' ? 10 : 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${formatMonto(value)} (${percentage}%)`;
            }
          }
        }
      }
    };
  }, [dispositivo, formatMonto]);

  // Renderizar filtros
  const renderFiltros = () => (
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
            type="button"
            className={agrupacion === 'mes' ? 'active' : ''}
            onClick={() => setAgrupacion('mes')}
          >
            Mes
          </button>
          <button
            type="button"
            className={agrupacion === 'trimestre' ? 'active' : ''}
            onClick={() => setAgrupacion('trimestre')}
          >
            Trimestre
          </button>
          <button
            type="button"
            className={agrupacion === 'año' ? 'active' : ''}
            onClick={() => setAgrupacion('año')}
          >
            Año
          </button>
        </div>
      </div>
      
      {historialCuentas.length > 0 && (
        <button 
          type="button"
          className="export-button"
          onClick={exportarCSV}
        >
          Exportar Datos
        </button>
      )}
    </div>
  );

  // Renderizar resumen
  const renderResumen = () => (
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
      
      <div className="donut-chart-container">
        <h3>Estado general de pagos</h3>
        <div className="chart-wrapper donut">
          <Doughnut data={doughnutData} options={pieChartOptions} />
        </div>
      </div>
      
      <h3>Últimas cuentas</h3>
      <div className="tabla-recientes">
        <table className="tabla-cuentas">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cuenta</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {historialCuentas.slice(0, 5).map(cuenta => (
              <tr key={cuenta.id} className={cuenta.estaPagada ? 'pagada' : 'pendiente'}>
                <td>{formatFecha(cuenta.fechaCreacion)}</td>
                <td>{cuenta.nombre}</td>
                <td className="monto">{formatMonto(cuenta.monto)}</td>
                <td>
                  <span className={`estado-badge ${cuenta.estaPagada ? 'pagada' : 'pendiente'}`}>
                    {cuenta.estaPagada ? 'Pagada' : 'Pendiente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Renderizar tendencias
  const renderTendencias = () => (
    <div className="grafico-card tendencia">
      <h3>Tendencia por Período</h3>
      <div className="chart-wrapper">
        <Line data={lineChartData} options={chartOptions} />
      </div>
      
      <div className="interpretacion">
        <h4>Interpretación</h4>
        <p>Este gráfico muestra la evolución de tus cuentas a lo largo del tiempo, permitiéndote visualizar tendencias de gastos y pagos.</p>
        <ul>
          <li><span className="dot blue"></span> <strong>Total:</strong> Valor total de las cuentas en cada período</li>
          <li><span className="dot green"></span> <strong>Pagadas:</strong> Monto de cuentas pagadas en cada período</li>
          <li><span className="dot red"></span> <strong>Pendientes:</strong> Monto de cuentas pendientes en cada período</li>
        </ul>
      </div>
    </div>
  );

  // Renderizar categorías
  const renderCategorias = () => (
    <div className="grafico-card distribucion">
      <h3>Distribución por Categoría</h3>
      <div className="chart-wrapper">
        <Bar data={barChartData} options={chartOptions} />
      </div>
      
      <div className="tabla-categorias">
        <h4>Detalle por categoría</h4>
        <table className="tabla-cuentas">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Total</th>
              <th>Pagado</th>
              <th>Pendiente</th>
              <th>% Pagado</th>
            </tr>
          </thead>
          <tbody>
            {datosAgrupados.porCategoria.map((categoria, index) => {
              const porcentajePagado = categoria.total > 0 
                ? Math.round((categoria.pagadas / categoria.total) * 100) 
                : 0;
              
              return (
                <tr key={index}>
                  <td>{categoria.categoria}</td>
                  <td>{formatMonto(categoria.total)}</td>
                  <td>{formatMonto(categoria.pagadas)}</td>
                  <td>{formatMonto(categoria.pendientes)}</td>
                  <td>
                    <div className="porcentaje-container">
                      <span className={porcentajePagado > 75 ? 'bueno' : porcentajePagado > 50 ? 'medio' : 'bajo'}>
                        {porcentajePagado}%
                      </span>
                      <div className="mini-barra-progreso">
                        <div 
                          className={`progreso ${porcentajePagado > 75 ? 'bueno' : porcentajePagado > 50 ? 'medio' : 'bajo'}`}
                          style={{ width: `${porcentajePagado}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Renderizar períodos
  const renderPeriodos = () => (
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
    </div>
  );

  // Renderizar pestañas para móvil
  const renderTabs = () => (
    <div className="tabs-container">
      <div className="tabs">
        <button 
          type="button"
          className={`tab ${activeTab === 'resumen' ? 'active' : ''}`} 
          onClick={() => setActiveTab('resumen')}
        >
          Resumen
        </button>
        <button 
          type="button"
          className={`tab ${activeTab === 'tendencias' ? 'active' : ''}`} 
          onClick={() => setActiveTab('tendencias')}
        >
          Tendencias
        </button>
        <button 
          type="button"
          className={`tab ${activeTab === 'categorias' ? 'active' : ''}`} 
          onClick={() => setActiveTab('categorias')}
        >
          Categorías
        </button>
        <button 
          type="button"
          className={`tab ${activeTab === 'periodos' ? 'active' : ''}`} 
          onClick={() => setActiveTab('periodos')}
        >
          Períodos
        </button>
      </div>
    </div>
  );

  return (
    <div className="historial-page">
      <NavBar />
      
      <div className="historial-container">
        <div className="historial-header">
          <h2>Historial de Cuentas</h2>
        </div>
        
        {/* Mostrar filtros */}
        {renderFiltros()}
        
        {/* Contenido principal del historial */}
        <div className="historial-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando historial...</p>
            </div>
          ) : historialCuentas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No hay datos disponibles</h3>
              <p>No se encontraron cuentas que coincidan con los filtros seleccionados.</p>
              <p>Prueba a cambiar los filtros o a crear nuevas cuentas.</p>
            </div>
          ) : (
            <>
              {/* Móvil: mostrar pestañas */}
              {dispositivo === 'movil' && renderTabs()}
              
              {/* Móvil: mostrar contenido según pestaña activa */}
              {dispositivo === 'movil' && (
                <div className="tab-content">
                  {activeTab === 'resumen' && renderResumen()}
                  {activeTab === 'tendencias' && renderTendencias()}
                  {activeTab === 'categorias' && renderCategorias()}
                  {activeTab === 'periodos' && renderPeriodos()}
                </div>
              )}
              
              {/* Escritorio: mostrar todo el contenido */}
              {dispositivo === 'escritorio' && (
                <>
                  {renderResumen()}
                  
                  <div className="graficos-container">
                    {renderTendencias()}
                    {renderCategorias()}
                  </div>
                  
                  {renderPeriodos()}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Historial;
