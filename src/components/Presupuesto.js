import React, { useState, useEffect, useCallback, useRef } from 'react';
import NavBar from './NavBar';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import db from '../utils/database';
import { useAuth } from '../contexts/AuthContext';
import './Presupuesto.css';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Presupuesto = () => {
  const { currentUser } = useAuth();
  const [presupuestos, setPresupuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPresupuesto, setEditingPresupuesto] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth());
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [resumenPresupuesto, setResumenPresupuesto] = useState({
    totalAsignado: 0,
    totalGastado: 0,
    porcentajeGastado: 0,
    categoriasMasGastadas: []
  });
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);
  
  const contentRef = useRef(null);
  
  // Función para obtener datos desde la base de datos
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener presupuestos
      const presupuestosArray = await db.presupuestos.toArray();
      setPresupuestos(presupuestosArray);
      
      // Obtener categorías para uso en formularios y filtros
      const categoriasArray = await db.categorias.toArray();
      setCategorias(categoriasArray);
      
      // Obtener cuentas para referencia
      const cuentasArray = await db.cuentas.toArray();
      setCuentas(cuentasArray);
      
      // Calcular resumen del presupuesto
      await calcularResumenPresupuesto(presupuestosArray, cuentasArray);
      
      return { presupuestosArray, categoriasArray, cuentasArray };
    } catch (error) {
      console.error('Error al cargar datos de presupuesto:', error);
      showNotification('Error al cargar datos del presupuesto', 'error');
      return {};
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Calcular estadísticas de presupuesto
  const calcularResumenPresupuesto = useCallback(async (presupuestosArr = presupuestos, cuentasArr = cuentas) => {
    // Filtrar presupuestos por mes y año seleccionados
    const presupuestosFiltrados = presupuestosArr.filter(p => {
      const fecha = new Date(p.fechaCreacion);
      return fecha.getMonth() === filtroMes && fecha.getFullYear() === filtroAno;
    });
    
    // Calcular totales
    const totalAsignado = presupuestosFiltrados.reduce((sum, p) => sum + p.montoAsignado, 0);
    
    // Calcular gastos por categoría
    const gastosPorCategoria = {};
    for (const cuenta of cuentasArr) {
      const fechaCuenta = new Date(cuenta.fechaCreacion);
      if (fechaCuenta.getMonth() === filtroMes && fechaCuenta.getFullYear() === filtroAno) {
        const categoria = cuenta.categoria || 'sin_categoria';
        if (!gastosPorCategoria[categoria]) gastosPorCategoria[categoria] = 0;
        gastosPorCategoria[categoria] += cuenta.monto;
      }
    }
    
    // Obtener total gastado
    const totalGastado = Object.values(gastosPorCategoria).reduce((sum, monto) => sum + monto, 0);
    
    // Calcular porcentaje gastado
    const porcentajeGastado = totalAsignado > 0 ? Math.round((totalGastado / totalAsignado) * 100) : 0;
    
    // Categorías más gastadas (ordenadas)
    const categoriasMasGastadas = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, monto]) => ({ 
        categoria, 
        monto,
        porcentaje: totalGastado > 0 ? Math.round((monto / totalGastado) * 100) : 0
      }));
    
    setResumenPresupuesto({
      totalAsignado,
      totalGastado,
      porcentajeGastado,
      categoriasMasGastadas
    });
  }, [filtroMes, filtroAno, presupuestos, cuentas]);
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchData();
    
    // Listener para responsive
    const handleResize = () => {
      setMobileView(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchData]);
  
  // Efecto para recalcular al cambiar filtros
  useEffect(() => {
    calcularResumenPresupuesto();
  }, [filtroMes, filtroAno, calcularResumenPresupuesto]);
  
  // Función para mostrar notificaciones de manera centralizada
  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ message, type });
    if (duration) {
      setTimeout(() => setNotification(null), duration);
    }
  };
  
  // Handler para crear nuevo presupuesto
  const handleCrearPresupuesto = () => {
    setEditingPresupuesto(null);
    setShowForm(true);
    
    // En móvil, scroll al principio
    if (mobileView && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Handler para editar presupuesto
  const handleEditarPresupuesto = (presupuesto) => {
    setEditingPresupuesto(presupuesto);
    setShowForm(true);
    
    // En móvil, scroll al principio
    if (mobileView && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Handler para guardar presupuesto
  const handleGuardarPresupuesto = async (presupuestoData) => {
    try {
      const isEditing = !!presupuestoData.id;
      
      if (isEditing) {
        // Actualizar presupuesto existente
        await db.presupuestos.update(presupuestoData.id, presupuestoData);
        showNotification(`Presupuesto actualizado correctamente`);
      } else {
        // Crear nuevo presupuesto
        const id = await db.presupuestos.add({
          ...presupuestoData,
          fechaCreacion: new Date().toISOString(),
          userId: currentUser.uid
        });
        showNotification(`Presupuesto creado correctamente`);
      }
      
      // Actualizar lista y cerrar formulario
      fetchData();
      setShowForm(false);
      setEditingPresupuesto(null);
      
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      showNotification('Error al guardar el presupuesto', 'error');
    }
  };
  
  // Handler para eliminar presupuesto
  const handleEliminarPresupuesto = async (id) => {
    try {
      await db.presupuestos.delete(id);
      showNotification('Presupuesto eliminado correctamente');
      fetchData();
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error);
      showNotification('Error al eliminar el presupuesto', 'error');
    }
  };
  
  // Formatear montos
  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };
  
  // Generar datos para el gráfico de pastel
  const getPieChartData = () => {
    const colors = [
      '#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0',
      '#3F51B5', '#E91E63', '#00BCD4', '#8BC34A', '#FF9800',
      '#009688', '#673AB7', '#FFEB3B', '#795548', '#607D8B'
    ];
    
    const labels = resumenPresupuesto.categoriasMasGastadas.map(c => 
      c.categoria === 'sin_categoria' ? 'Sin categoría' : c.categoria
    );
    
    const data = resumenPresupuesto.categoriasMasGastadas.map(c => c.monto);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, data.length),
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Generar datos para el gráfico de barras (Presupuesto vs Gasto)
  const getBarChartData = () => {
    // Obtener presupuestos por categoría
    const presupuestoPorCategoria = {};
    presupuestos.forEach(p => {
      const fecha = new Date(p.fechaCreacion);
      if (fecha.getMonth() === filtroMes && fecha.getFullYear() === filtroAno) {
        if (!presupuestoPorCategoria[p.categoria]) {
          presupuestoPorCategoria[p.categoria] = 0;
        }
        presupuestoPorCategoria[p.categoria] += p.montoAsignado;
      }
    });
    
    // Preparar datos para el gráfico
    const categorias = [...new Set([
      ...Object.keys(presupuestoPorCategoria),
      ...resumenPresupuesto.categoriasMasGastadas.map(c => c.categoria)
    ])];
    
    const presupuestosData = [];
    const gastosData = [];
    
    categorias.forEach(categoria => {
      presupuestosData.push(presupuestoPorCategoria[categoria] || 0);
      
      const gastoCategoria = resumenPresupuesto.categoriasMasGastadas
        .find(c => c.categoria === categoria);
      gastosData.push(gastoCategoria ? gastoCategoria.monto : 0);
    });
    
    return {
      labels: categorias.map(c => c === 'sin_categoria' ? 'Sin categoría' : c),
      datasets: [
        {
          label: 'Presupuesto',
          data: presupuestosData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Gasto Real',
          data: gastosData,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Opciones para los gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            return formatMonto(value);
          }
        }
      }
    }
  };
  
  // Nombres de los meses para el selector
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Generar array de años para el selector (5 años atrás hasta 5 años adelante)
  const getYearsArray = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };
  
  return (
    <div className="presupuesto-page">
      <NavBar />
      
      <div className="presupuesto-container">
        <div className="presupuesto-header">
          <h2>Presupuesto Familiar</h2>
          
          <button 
            className="crear-presupuesto-button"
            onClick={handleCrearPresupuesto}
          >
            <i className="icon">+</i> Crear Presupuesto
          </button>
        </div>
        
        {/* Filtros de período */}
        <div className="periodo-filter">
          <div className="filter-title">Período seleccionado:</div>
          <div className="filter-controls">
            <select 
              value={filtroMes}
              onChange={(e) => setFiltroMes(parseInt(e.target.value))}
              className="mes-select"
            >
              {meses.map((mes, index) => (
                <option key={index} value={index}>{mes}</option>
              ))}
            </select>
            
            <select 
              value={filtroAno}
              onChange={(e) => setFiltroAno(parseInt(e.target.value))}
              className="ano-select"
            >
              {getYearsArray().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div 
          ref={contentRef} 
          className={`presupuesto-content ${showForm ? 'with-side-panel' : ''} ${mobileView ? 'mobile-view' : ''}`}
        >
          {/* Panel principal de presupuesto */}
          <div className="panel-principal">
            {loading ? (
              <div className="loading-indicator">
                <div className="loading-content">
                  <div className="spinner"></div>
                  <p>Cargando presupuesto...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Tarjetas de resumen */}
                <div className="resumen-cards">
                  <div className="resumen-card total-asignado">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                      <div className="card-title">Presupuesto Total</div>
                      <div className="card-value">{formatMonto(resumenPresupuesto.totalAsignado)}</div>
                    </div>
                  </div>
                  
                  <div className="resumen-card total-gastado">
                    <div className="card-icon">💸</div>
                    <div className="card-content">
                      <div className="card-title">Gasto Total</div>
                      <div className="card-value">{formatMonto(resumenPresupuesto.totalGastado)}</div>
                    </div>
                  </div>
                  
                  <div className="resumen-card porcentaje">
                    <div className="card-icon">📊</div>
                    <div className="card-content">
                      <div className="card-title">% Utilizado</div>
                      <div className="card-value">{resumenPresupuesto.porcentajeGastado}%</div>
                    </div>
                    <div 
                      className={`progress-bar ${resumenPresupuesto.porcentajeGastado > 90 ? 'peligro' : resumenPresupuesto.porcentajeGastado > 75 ? 'advertencia' : 'normal'}`}
                    >
                      <div 
                        className="progress" 
                        style={{ width: `${Math.min(resumenPresupuesto.porcentajeGastado, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Gráficos */}
                <div className="graficos-container">
                  <div className="grafico-card">
                    <h3>Distribución de Gastos</h3>
                    <div className="grafico-wrapper">
                      <Pie data={getPieChartData()} options={chartOptions} />
                    </div>
                  </div>
                  
                  <div className="grafico-card">
                    <h3>Presupuesto vs Gasto Real</h3>
                    <div className="grafico-wrapper">
                      <Bar data={getBarChartData()} options={chartOptions} />
                    </div>
                  </div>
                </div>
                
                {/* Tabla de presupuestos */}
                <div className="presupuestos-container">
                  <h3>Presupuestos del Período</h3>
                  
                  {presupuestos.filter(p => {
                    const fecha = new Date(p.fechaCreacion);
                    return fecha.getMonth() === filtroMes && fecha.getFullYear() === filtroAno;
                  }).length === 0 ? (
                    <div className="empty-table">
                      <p>No hay presupuestos para este período</p>
                      <button 
                        className="action-button"
                        onClick={handleCrearPresupuesto}
                      >
                        Crear presupuesto
                      </button>
                    </div>
                  ) : (
                    <div className="tabla-responsive">
                      <table className="presupuestos-table">
                        <thead>
                          <tr>
                            <th>Categoría</th>
                            <th>Monto Asignado</th>
                            <th>Monto Utilizado</th>
                            <th>% Utilizado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {presupuestos
                            .filter(p => {
                              const fecha = new Date(p.fechaCreacion);
                              return fecha.getMonth() === filtroMes && fecha.getFullYear() === filtroAno;
                            })
                            .map(presupuesto => {
                              // Encontrar gasto real de esta categoría
                              const gastoCategoria = resumenPresupuesto.categoriasMasGastadas
                                .find(c => c.categoria === presupuesto.categoria);
                              const gastoReal = gastoCategoria ? gastoCategoria.monto : 0;
                              const porcentajeUtilizado = presupuesto.montoAsignado > 0
                                ? Math.round((gastoReal / presupuesto.montoAsignado) * 100)
                                : 0;
                                
                              return (
                                <tr key={presupuesto.id}>
                                  <td>{presupuesto.categoria}</td>
                                  <td>{formatMonto(presupuesto.montoAsignado)}</td>
                                  <td>{formatMonto(gastoReal)}</td>
                                  <td>
                                    <div className="porcentaje-container">
                                      <span className={
                                        porcentajeUtilizado > 100 ? 'excedido' :
                                        porcentajeUtilizado > 90 ? 'peligro' :
                                        porcentajeUtilizado > 75 ? 'advertencia' : ''
                                      }>
                                        {porcentajeUtilizado}%
                                      </span>
                                      <div className="mini-progress-bar">
                                        <div 
                                          className={`mini-progress ${
                                            porcentajeUtilizado > 100 ? 'excedido' :
                                            porcentajeUtilizado > 90 ? 'peligro' :
                                            porcentajeUtilizado > 75 ? 'advertencia' : 'normal'
                                          }`}
                                          style={{ width: `${Math.min(porcentajeUtilizado, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="table-actions">
                                      <button 
                                        className="edit-button"
                                        onClick={() => handleEditarPresupuesto(presupuesto)}
                                      >
                                        <i className="edit-icon">✏️</i>
                                      </button>
                                      <button 
                                        className="delete-button"
                                        onClick={() => handleEliminarPresupuesto(presupuesto.id)}
                                      >
                                        <i className="delete-icon">🗑️</i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Formulario lateral */}
          {showForm && (
            <div className={`side-panel form-panel ${mobileView ? 'mobile' : ''}`}>
              <div className="panel-header">
                <h3>{editingPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h3>
                <button 
                  className="close-panel"
                  onClick={() => setShowForm(false)}
                  aria-label="Cerrar panel"
                >
                  ×
                </button>
              </div>
              <div className="panel-content">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const presupuestoData = {
                    categoria: formData.get('categoria'),
                    montoAsignado: parseFloat(formData.get('monto')),
                    descripcion: formData.get('descripcion') || '',
                  };
                  
                  if (editingPresupuesto) {
                    presupuestoData.id = editingPresupuesto.id;
                    presupuestoData.fechaCreacion = editingPresupuesto.fechaCreacion;
                    presupuestoData.userId = editingPresupuesto.userId;
                  }
                  
                  handleGuardarPresupuesto(presupuestoData);
                }}>
                  <div className="form-group">
                    <label htmlFor="categoria">Categoría</label>
                    <select
                      id="categoria"
                      name="categoria"
                      required
                      defaultValue={editingPresupuesto?.categoria || ''}
                    >
                      <option value="" disabled>Selecciona una categoría</option>
                      {categorias.map(categoria => (
                        <option key={categoria.id} value={categoria.nombre}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="monto">Monto Asignado</label>
                    <input
                      type="number"
                      id="monto"
                      name="monto"
                      min="0"
                      step="1000"
                      required
                      defaultValue={editingPresupuesto?.montoAsignado || ''}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="descripcion">Descripción (opcional)</label>
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      rows="4"
                      defaultValue={editingPresupuesto?.descripcion || ''}
                    ></textarea>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="save-button">
                      {editingPresupuesto ? 'Actualizar' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        
        {/* Notificaciones */}
        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        
        {/* Botón flotante para volver en móvil */}
        {mobileView && showForm && (
          <button 
            className="floating-back-button"
            onClick={() => setShowForm(false)}
          >
            ← Volver
          </button>
        )}
      </div>
    </div>
  );
};

export default Presupuesto;
