import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import db from '../../utils/database';
import { useAuth } from '../../contexts/AuthContext';
import NavBar from '../NavBar';
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
  const [mostrarCampoOtros, setMostrarCampoOtros] = useState(false);
  const contentRef = useRef(null);
  const nombresCreadores = ['Camilo', 'Chave', 'Daniela', 'Mia'];
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchDataInternal = async () => {
      try {
        setLoading(true);
        const [presupuestosArray, categoriasArray, cuentasArray] = await Promise.all([
          db.presupuestos.toArray(),
          db.categorias.toArray(),
          db.cuentas.toArray()
        ]);
        setPresupuestos(presupuestosArray);
        setCategorias(categoriasArray);
        setCuentas(cuentasArray);
      } catch (error) {
        console.error('Error al cargar datos de presupuesto:', error);
        showNotification('Error al cargar datos del presupuesto', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDataInternal();

    const handleResize = () => {
      setMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [refreshTrigger]);

  useEffect(() => {
    const calcularResumen = () => {
      const presupuestosFiltrados = presupuestos.filter(p => {
        const fecha = p.fechaCreacion ? new Date(p.fechaCreacion) : null;
        return fecha && fecha.getMonth() === filtroMes && fecha.getFullYear() === filtroAno;
      });
      const totalAsignado = presupuestosFiltrados.reduce((sum, p) => sum + (p.montoAsignado || 0), 0);

      const gastosPorCategoria = {};
      for (const cuenta of cuentas) {
        if (cuenta.fechaCreacion) {
          const fechaCuenta = new Date(cuenta.fechaCreacion);
          if (fechaCuenta.getMonth() === filtroMes && fechaCuenta.getFullYear() === filtroAno) {
            const categoria = cuenta.categoria || 'sin_categoria';
            if (!gastosPorCategoria[categoria]) gastosPorCategoria[categoria] = 0;
            gastosPorCategoria[categoria] += (cuenta.monto || 0);
          }
        }
      }
      const totalGastado = Object.values(gastosPorCategoria).reduce((sum, monto) => sum + monto, 0);
      const porcentajeGastado = totalAsignado > 0 ? Math.round((totalGastado / totalAsignado) * 100) : 0;
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
    };

    if (!loading) {
      calcularResumen();
    }
  }, [presupuestos, cuentas, filtroMes, filtroAno, loading]);

  useEffect(() => {
    if (editingPresupuesto?.categoria) {
      const categoriasValidas = ['Luz', 'Agua', 'Gas', 'Internet', 'Utiles de Aseo', 'Otros'];

      if (!categoriasValidas.includes(editingPresupuesto.categoria)) {
        const categoriasMapping = {
          'servicios': 'Luz',
          'alimentos': 'Agua',
          'transporte': 'Gas',
          'entretenimiento': 'Internet',
          'salud': 'Utiles de Aseo',
          'educacion': 'Otros'
        };

        const nuevaCategoria = categoriasMapping[editingPresupuesto.categoria.toLowerCase()] || 'Otros';

        setEditingPresupuesto(prev => ({
          ...prev,
          categoria: nuevaCategoria,
          categoriaEspecifica: nuevaCategoria === 'Otros' ? prev.categoria : ''
        }));

        setMostrarCampoOtros(nuevaCategoria === 'Otros');
      } else {
        setMostrarCampoOtros(editingPresupuesto.categoria === 'Otros');
      }
    } else {
      setMostrarCampoOtros(false);
    }
  }, [editingPresupuesto?.categoria]);

  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ message, type });
    if (duration) {
      setTimeout(() => setNotification(null), duration);
    }
  };

  const handleCrearPresupuesto = () => {
    setEditingPresupuesto(null);
    setMostrarCampoOtros(false);
    setShowForm(true);
    if (mobileView && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditarPresupuesto = (presupuesto) => {
    setEditingPresupuesto(presupuesto);
    setShowForm(true);
    if (mobileView && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGuardarPresupuesto = async (presupuestoData) => {
    try {
      const isEditing = !!presupuestoData.id;
      if (isEditing) {
        await db.presupuestos.update(presupuestoData.id, presupuestoData);
        showNotification(`Presupuesto actualizado correctamente`);
      } else {
        await db.presupuestos.add({
          ...presupuestoData,
          fechaCreacion: new Date().toISOString(),
          userId: currentUser.uid
        });
        showNotification(`Presupuesto creado correctamente`);
      }
      setRefreshTrigger(prev => prev + 1);
      setShowForm(false);
      setEditingPresupuesto(null);
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      showNotification('Error al guardar el presupuesto', 'error');
    }
  };

  const handleEliminarPresupuesto = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
      try {
        await db.presupuestos.delete(id);
        showNotification('Presupuesto eliminado correctamente');
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error al eliminar presupuesto:', error);
        showNotification('Error al eliminar el presupuesto', 'error');
      }
    }
  };

  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

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

  const getBarChartData = () => {
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
            size: 12,
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw;
            return formatMonto(value);
          }
        }
      }
    }
  };

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getYearsArray = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const handleCategoriaChange = (e) => {
    const categoriaSeleccionada = e.target.value;
    if (editingPresupuesto) {
      setEditingPresupuesto(prev => ({
        ...prev,
        categoria: categoriaSeleccionada,
        categoriaEspecifica: categoriaSeleccionada === 'Otros' ? prev.categoriaEspecifica : ''
      }));
    }
    setMostrarCampoOtros(categoriaSeleccionada === 'Otros');
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

                <div className="presupuestos-container">
                  <h3>Presupuestos del Período</h3>
                  {presupuestos.filter(p => {
                    const fecha = p.fechaCreacion ? new Date(p.fechaCreacion) : null;
                    return fecha && fecha.getMonth() === filtroMes && fecha.getFullYear() === filtroAno;
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
                            <th>Creador</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {presupuestos.filter(p => {
                            const fecha = p.fechaCreacion ? new Date(p.fechaCreacion) : null;
                            return fecha && fecha.getMonth() === filtroMes && fecha.getFullYear() === filtroAno;
                          })
                            .map(presupuesto => {
                              const gastoCategoria = resumenPresupuesto.categoriasMasGastadas
                                .find(c => c.categoria === presupuesto.categoria);
                              const gastoReal = gastoCategoria ? gastoCategoria.monto : 0;
                              const porcentajeUtilizado = presupuesto.montoAsignado > 0
                                ? Math.round((gastoReal / presupuesto.montoAsignado) * 100)
                                : 0;

                              return (
                                <tr key={presupuesto.id}>
                                  <td>
                                    {presupuesto.categoria === 'Otros' && presupuesto.categoriaEspecifica
                                      ? `${presupuesto.categoria} - ${presupuesto.categoriaEspecifica}`
                                      : presupuesto.categoria}
                                  </td>
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
                                  <td>{presupuesto.creadorNombre || 'Usuario'}</td>
                                  <td className="acciones-column">
                                    <button
                                      className="edit-button"
                                      onClick={() => handleEditarPresupuesto(presupuesto)}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className="delete-button"
                                      onClick={() => handleEliminarPresupuesto(presupuesto.id)}
                                    >
                                      🗑️
                                    </button>
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
                    creadorNombre: formData.get('creadorNombre'),
                    categoriaEspecifica: formData.get('categoriaEspecifica') || null
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
                      value={editingPresupuesto?.categoria || ''}
                      onChange={handleCategoriaChange}
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {Array.from(new Set(categorias.map(cat => cat.nombre))).map(nombreCategoria => (
                        <option key={nombreCategoria} value={nombreCategoria}>
                          {nombreCategoria}
                        </option>
                      ))}
                    </select>
                  </div>

                  {mostrarCampoOtros && (
                    <div className="form-group">
                      <label htmlFor="categoriaEspecifica">Especificar Categoría*</label>
                      <input
                        type="text"
                        id="categoriaEspecifica"
                        name="categoriaEspecifica"
                        defaultValue={editingPresupuesto?.categoriaEspecifica || ''}
                        placeholder="Ej: Reparaciones, Mantenimiento, etc."
                        required
                      />
                    </div>
                  )}

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

                  <div className="form-group">
                    <label htmlFor="creadorNombre">Creador *</label>
                    <select
                      id="creadorNombre"
                      name="creadorNombre"
                      required
                      defaultValue={editingPresupuesto?.creadorNombre || ''}
                    >
                      <option value="" disabled>Selecciona un creador</option>
                      {nombresCreadores.map(nombre => (
                        <option key={nombre} value={nombre}>
                          {nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-buttons">
                    <button type="submit" disabled={loading}>
                      {loading ? 'Guardando...' : editingPresupuesto ? 'Actualizar' : 'Guardar'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

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
