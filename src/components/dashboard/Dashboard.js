import React, { useState, useEffect, useCallback } from 'react'; // Remover useMemo si no se usa
import { useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';
import CuentasList from '../CuentasList';
import CuentaDetalle from '../CuentaDetalle';
import PagoForm from '../PagoForm';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import db from '../../utils/database';
import { useAuth } from '../../contexts/AuthContext';
import ResumenCards from './ResumenCards';
import ProximosVencimientos from './ProximosVencimientos';
import AccionesRapidas from './AccionesRapidas';
import DashboardGraficos from './DashboardGraficos';
import './Dashboard.css';

// Registrar los componentes de Chart.js necesarios
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [refreshData, setRefreshData] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resumen');
  const [subTab, setSubTab] = useState('pendientes');
  const [mesActual, setMesActual] = useState('');
  const [mesAnterior, setMesAnterior] = useState('');
  const [cuentasPendientes, setCuentasPendientes] = useState([]);
  const [cuentasPagadas, setCuentasPagadas] = useState([]);
  const [cuentasMesActual, setCuentasMesActual] = useState([]);
  const [cuentasMesAnterior, setCuentasMesAnterior] = useState([]);
  const [presupuestoMesActual, setPresupuestoMesActual] = useState(null);
  const [presupuestoMesAnterior, setPresupuestoMesAnterior] = useState(null);
  const [aportesMesActual, setAportesMesActual] = useState([]);
  const [aportesMesAnterior, setAportesMesAnterior] = useState([]);
  const [datosPorCategoria, setDatosPorCategoria] = useState({});
  const [comparativaMeses, setComparativaMeses] = useState({});
  const [cuentasProximasVencer, setCuentasProximasVencer] = useState([]);
  const [resumenFinanciero, setResumenFinanciero] = useState({
    totalPendiente: 0,
    totalPagado: 0,
    presupuestoTotal: 0,
    presupuestoRestante: 0,
    progreso: 0,
    tendencia: 0
  });

  useEffect(() => {
    const today = new Date();
    const mesActualStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const mesAnteriorFecha = new Date(today.getFullYear(), today.getMonth() - 1);
    const mesAnteriorStr = `${mesAnteriorFecha.getFullYear()}-${String(mesAnteriorFecha.getMonth() + 1).padStart(2, '0')}`;
    setMesActual(mesActualStr);
    setMesAnterior(mesAnteriorStr);
  }, []);

  const generarResumenFinanciero = useCallback(() => {
    try {
      const totalPendiente = cuentasMesActual
        .filter(c => !c.estaPagada)
        .reduce((sum, c) => sum + (c.monto - (c.totalPagado || 0)), 0);

      const totalPagado = cuentasMesActual
        .reduce((sum, c) => sum + (c.totalPagado || 0), 0);

      const presupuestoTotal = presupuestoMesActual 
        ? (presupuestoMesActual.montoAporte || presupuestoMesActual.montoObjetivo || 0) 
        : 0;

      const totalAportado = aportesMesActual.reduce((sum, a) => sum + (a.monto || 0), 0);
      const presupuestoRestante = Math.max(0, presupuestoTotal - totalAportado);

      const progreso = presupuestoTotal > 0 
        ? Math.min(100, (totalAportado / presupuestoTotal) * 100) 
        : 0;

      let tendencia = 0;

      if (cuentasMesAnterior.length > 0) {
        const gastoMesAnterior = cuentasMesAnterior.reduce((sum, c) => sum + (c.monto || 0), 0);
        const gastoMesActual = cuentasMesActual.reduce((sum, c) => sum + (c.monto || 0), 0);

        if (gastoMesAnterior > 0) {
          tendencia = ((gastoMesActual - gastoMesAnterior) / gastoMesAnterior) * 100;
        }
      }

      setResumenFinanciero({
        totalPendiente,
        totalPagado,
        presupuestoTotal,
        presupuestoRestante,
        progreso,
        tendencia
      });
    } catch (error) {
      console.error('Error al generar resumen financiero:', error);
    }
  }, [cuentasMesActual, cuentasMesAnterior, presupuestoMesActual, aportesMesActual]);

  const prepararDatosGraficos = useCallback(() => {
    try {
      const categorias = {};
      const categoriasValidas = ['Luz', 'Agua', 'Gas', 'Internet', 'Utiles de Aseo', 'Otros', 'sin_categoria'];

      cuentasMesActual.forEach(cuenta => {
        let categoria = cuenta.categoria || 'sin_categoria';

        if (!categoriasValidas.includes(categoria)) {
          categoria = 'Otros';
        }

        if (!categorias[categoria]) {
          categorias[categoria] = 0;
        }
        categorias[categoria] += cuenta.monto || 0;
      });

      const etiquetas = {
        'Luz': 'Luz',
        'Agua': 'Agua',
        'Gas': 'Gas', 
        'Internet': 'Internet',
        'Utiles de Aseo': 'Útiles de Aseo',
        'Otros': 'Otros',
        'sin_categoria': 'Sin categoría'
      };

      const colores = {
        'Luz': '#f39c12',
        'Agua': '#3498db',
        'Gas': '#e74c3c',
        'Internet': '#9b59b6',
        'Utiles de Aseo': '#2ecc71',
        'Otros': '#95a5a6',
        'sin_categoria': '#7f8c8d'
      };

      if (Object.keys(categorias).length > 0) {
        const datosCategorias = {
          labels: Object.keys(categorias).map(key => etiquetas[key] || key),
          datasets: [{
            data: Object.values(categorias),
            backgroundColor: Object.keys(categorias).map(key => colores[key] || '#999'),
            borderWidth: 1
          }]
        };
        setDatosPorCategoria(datosCategorias);
      } else {
        setDatosPorCategoria({});
      }

      if (cuentasMesActual.length > 0 || cuentasMesAnterior.length > 0) {
        const categoriasTodas = new Set([
          ...Object.keys(categorias),
          ...cuentasMesAnterior.map(c => c.categoria || 'sin_categoria')
        ]);

        const categoriasMesAnterior = {};

        cuentasMesAnterior.forEach(cuenta => {
          const categoria = cuenta.categoria || 'sin_categoria';
          if (!categoriasMesAnterior[categoria]) {
            categoriasMesAnterior[categoria] = 0;
          }
          categoriasMesAnterior[categoria] += cuenta.monto || 0;
        });

        const datosComparativa = {
          labels: [...categoriasTodas].map(key => etiquetas[key] || key),
          datasets: [
            {
              label: 'Mes Actual',
              data: [...categoriasTodas].map(cat => categorias[cat] || 0),
              backgroundColor: 'rgba(52, 152, 219, 0.7)'
            },
            {
              label: 'Mes Anterior',
              data: [...categoriasTodas].map(cat => categoriasMesAnterior[cat] || 0),
              backgroundColor: 'rgba(231, 76, 60, 0.7)'
            }
          ]
        };

        setComparativaMeses(datosComparativa);
      } else {
        setComparativaMeses({});
      }
    } catch (error) {
      console.error('Error al preparar datos para gráficos:', error);
    }
  }, [cuentasMesActual, cuentasMesAnterior]);

  useEffect(() => {
    if (!mesActual || !mesAnterior) return;

    const cargarPresupuestosYAportesInterno = async () => {
      try {
        const [presupuestoActual, presupuestoAnterior] = await Promise.all([
          db.presupuestos.where('mes').equals(mesActual).toArray(),
          db.presupuestos.where('mes').equals(mesAnterior).toArray()
        ]);
        const presupActual = presupuestoActual.length > 0 ? presupuestoActual[0] : null;
        const presupAnterior = presupuestoAnterior.length > 0 ? presupuestoAnterior[0] : null;
        setPresupuestoMesActual(presupActual);
        setPresupuestoMesAnterior(presupAnterior);

        const promesasAportes = [];
        if (presupActual) {
          promesasAportes.push(
            db.aportes.where('presupuestoId').equals(presupActual.id).toArray()
              .then(aportesActual => setAportesMesActual(aportesActual))
          );
        } else {
          setAportesMesActual([]);
        }
        if (presupAnterior) {
          promesasAportes.push(
            db.aportes.where('presupuestoId').equals(presupAnterior.id).toArray()
              .then(aportesAnterior => setAportesMesAnterior(aportesAnterior))
          );
        } else {
          setAportesMesAnterior([]);
        }
        await Promise.all(promesasAportes);
      } catch (error) {
        console.error('Error al cargar presupuestos y aportes:', error);
        throw error;
      }
    };

    const procesarCuentasYPagosInterno = (cuentasArray, pagosArray) => {
      try {
        const infosPorCuenta = pagosArray.reduce((mapa, pago) => {
          if (!mapa[pago.cuentaId]) {
            mapa[pago.cuentaId] = {
              totalPagado: 0,
              fechaUltimoPago: null
            };
          }

          mapa[pago.cuentaId].totalPagado += pago.montoPagado;

          if (!mapa[pago.cuentaId].fechaUltimoPago || 
              new Date(pago.fechaPago) > new Date(mapa[pago.cuentaId].fechaUltimoPago)) {
            mapa[pago.cuentaId].fechaUltimoPago = pago.fechaPago;
          }

          return mapa;
        }, {});

        const hoy = new Date();
        const enDiezDias = new Date(hoy);
        enDiezDias.setDate(hoy.getDate() + 10);

        const inicioMesActual = new Date(mesActual + '-01');
        const finMesActual = new Date(inicioMesActual);
        finMesActual.setMonth(finMesActual.getMonth() + 1);
        finMesActual.setDate(0);

        const inicioMesAnterior = new Date(mesAnterior + '-01');
        const finMesAnterior = new Date(inicioMesAnterior);
        finMesAnterior.setMonth(finMesAnterior.getMonth() + 1);
        finMesAnterior.setDate(0);

        const pendientes = [];
        const pagadas = [];
        const mesActualCuentas = [];
        const mesAnteriorCuentas = [];
        const proximasVencer = [];

        cuentasArray.forEach(cuenta => {
          const infoPagos = infosPorCuenta[cuenta.id] || { totalPagado: 0, fechaUltimoPago: null };
          const totalPagado = infoPagos.totalPagado;
          const estaPagada = totalPagado >= cuenta.monto;

          const cuentaConPago = {
            ...cuenta,
            totalPagado,
            estaPagada,
            fechaUltimoPago: infoPagos.fechaUltimoPago
          };

          if (estaPagada) {
            pagadas.push(cuentaConPago);
          } else {
            pendientes.push(cuentaConPago);
          }

          if (cuenta.fechaVencimiento) {
            const fechaVencimiento = new Date(cuenta.fechaVencimiento);

            if (fechaVencimiento >= inicioMesActual && fechaVencimiento <= finMesActual) {
              mesActualCuentas.push(cuentaConPago);
            }

            if (fechaVencimiento >= inicioMesAnterior && fechaVencimiento <= finMesAnterior) {
              mesAnteriorCuentas.push(cuentaConPago);
            }

            if (!estaPagada && fechaVencimiento >= hoy && fechaVencimiento <= enDiezDias) {
              proximasVencer.push(cuentaConPago);
            }
          }
        });

        pendientes.sort((a, b) => {
          if (!a.fechaVencimiento) return 1;
          if (!b.fechaVencimiento) return -1;
          return new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento);
        });

        proximasVencer.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

        setCuentasPendientes(pendientes);
        setCuentasPagadas(pagadas);
        setCuentasMesActual(mesActualCuentas);
        setCuentasMesAnterior(mesAnteriorCuentas);
        setCuentasProximasVencer(proximasVencer);
      } catch (error) {
        console.error('Error al procesar cuentas y pagos:', error);
        throw error;
      }
    };

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [cuentasArray, pagosArray] = await Promise.all([
          db.cuentas.toArray(),
          db.pagos.toArray()
        ]);

        await cargarPresupuestosYAportesInterno();
        procesarCuentasYPagosInterno(cuentasArray, pagosArray);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Ocurrió un error al cargar los datos financieros. Por favor intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [mesActual, mesAnterior, refreshData]);

  useEffect(() => {
    if (cuentasMesActual.length > 0 || cuentasMesAnterior.length > 0 || presupuestoMesActual !== undefined || aportesMesActual.length > 0) {
      generarResumenFinanciero();
      prepararDatosGraficos();
    }
  }, [cuentasMesActual, cuentasMesAnterior, presupuestoMesActual, aportesMesActual, generarResumenFinanciero, prepararDatosGraficos]);

  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        const cuentas = await db.cuentas.toArray();
        const pendientes = cuentas.filter((cuenta) => !cuenta.estaPagada);
        const pagadas = cuentas.filter((cuenta) => cuenta.estaPagada);

        setCuentasPendientes(pendientes);
        setCuentasPagadas(pagadas);
      } catch (error) {
        console.error('Error al cargar cuentas:', error);
      }
    };

    fetchCuentas();
  }, [refreshData]);

  const handleSelectCuenta = useCallback((cuenta) => {
    setSelectedCuenta(cuenta);
    setShowDetalle(true);
    setShowPagoForm(false);
  }, []);

  const handlePagoClick = useCallback(() => {
    setShowPagoForm(true);
    setShowDetalle(false);
  }, []);

  const handleBackClick = useCallback(() => {
    setShowDetalle(false);
    setSelectedCuenta(null);
  }, []);

  const handlePagoSuccess = useCallback(() => {
    setShowPagoForm(false);
    setSelectedCuenta(null);
    setShowDetalle(false);
    setRefreshData((prev) => prev + 1);
  }, []);

  const irAPresupuesto = useCallback(() => {
    navigate('/presupuesto');
  }, [navigate]);

  const irAGestionCuentas = useCallback(() => {
    navigate('/gestion-cuentas');
  }, [navigate]);

  const handleEliminarCuenta = useCallback(async (cuentaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta y sus pagos asociados? Esta acción no se puede deshacer.')) {
      try {
        await db.pagos.where('cuentaId').equals(cuentaId).delete();
        await db.cuentas.delete(cuentaId);
        console.log(`Cuenta ${cuentaId} eliminada.`);
        setRefreshData(prev => prev + 1);
      } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        setError('Error al eliminar la cuenta.');
      }
    }
  }, []);

  const formatoMes = (mesString) => {
    const [año, mes] = mesString.split('-');
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${nombresMeses[parseInt(mes) - 1]} ${año}`;
  };

  const formatoFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES');
  };

  const ErrorDisplay = ({ message }) => (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3>Error al cargar datos</h3>
      <p>{message}</p>
      <button 
        className="retry-button"
        onClick={() => setRefreshData(prev => prev + 1)}
      >
        Intentar de nuevo
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-page">
        <NavBar />
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Cargando información financiera...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <NavBar />
        <div className="dashboard-container">
          <ErrorDisplay message={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <NavBar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Panel Principal</h2>
          <div className="periodo-actual">
            <span className="periodo-label">Periodo actual:</span>
            <span className="periodo-value">{formatoMes(mesActual)}</span>
          </div>
        </div>
        
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'resumen' ? 'active' : ''}`}
            onClick={() => setActiveTab('resumen')}
          >
            Resumen
          </button>
          <button 
            className={`tab-button ${activeTab === 'cuentas' ? 'active' : ''}`}
            onClick={() => setActiveTab('cuentas')}
          >
            Cuentas ({cuentasPendientes.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'presupuesto' ? 'active' : ''}`}
            onClick={() => setActiveTab('presupuesto')}
          >
            Presupuesto
          </button>
          <button 
            className={`tab-button ${activeTab === 'historial' ? 'active' : ''}`}
            onClick={() => setActiveTab('historial')}
          >
            Historial
          </button>
        </div>
        
        {!showDetalle && !showPagoForm ? (
          <div className="dashboard-content">
            {activeTab === 'resumen' && (
              <div className="tab-content resumen-tab">
                <ResumenCards
                  resumenFinanciero={resumenFinanciero}
                  cuentasPendientes={cuentasPendientes}
                />

                <div className="proximas-y-acciones">
                  <ProximosVencimientos
                    cuentasProximasVencer={cuentasProximasVencer}
                    handleSelectCuenta={handleSelectCuenta}
                    formatoFecha={formatoFecha}
                  />
                  <AccionesRapidas
                    irAGestionCuentas={irAGestionCuentas}
                    irAPresupuesto={irAPresupuesto}
                    setActiveTab={setActiveTab}
                  />
                </div>

                <DashboardGraficos
                  datosPorCategoria={datosPorCategoria}
                  comparativaMeses={comparativaMeses}
                />
              </div>
            )}

            {activeTab === 'cuentas' && (
              <div className="tab-content cuentas-tab">
                <div className="cuentas-header">
                  <div className="cuentas-tabs">
                    <button 
                      className={`cuenta-tab ${subTab === 'pendientes' ? 'active' : ''}`} 
                      onClick={() => setSubTab('pendientes')}
                    >
                      Cuentas Pendientes ({cuentasPendientes.length})
                    </button>
                    <button 
                      className={`cuenta-tab ${subTab === 'pagadas' ? 'active' : ''}`} 
                      onClick={() => setSubTab('pagadas')}
                    >
                      Cuentas Pagadas ({cuentasPagadas.length})
                    </button>
                  </div>
                  <button 
                    className="nueva-cuenta-button"
                    onClick={irAGestionCuentas}
                  >
                    <span className="btn-icon">+</span> Nueva Cuenta
                  </button>
                </div>
                
                <div className="cuentas-container">
                  {subTab === 'pendientes' && cuentasPendientes.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <p>No tienes cuentas pendientes</p>
                      <button className="action-button" onClick={irAGestionCuentas}>
                        Crear una cuenta
                      </button>
                    </div>
                  ) : subTab === 'pagadas' && cuentasPagadas.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">✅</div>
                      <p>No tienes cuentas pagadas registradas</p>
                    </div>
                  ) : (
                    <CuentasList 
                      cuentas={subTab === 'pendientes' ? cuentasPendientes : cuentasPagadas} 
                      onSelectCuenta={handleSelectCuenta}
                      estadoLabel={subTab === 'pendientes' ? 'Pendiente' : 'Pagada'}
                      onDeleteCuenta={subTab === 'pagadas' ? handleEliminarCuenta : undefined}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'presupuesto' && (
              <div className="tab-content presupuesto-tab">
                {presupuestoMesActual ? (
                  <div className="presupuesto-resumen">
                    <div className="presupuesto-header">
                      <div className="presupuesto-titulo">
                        <h3>Presupuesto: {formatoMes(presupuestoMesActual.mes)}</h3>
                        <span className="presupuesto-creador">
                          Creado por: {presupuestoMesActual.creadorNombre || 'Usuario'}
                        </span>
                      </div>
                      <button 
                        className="ver-presupuesto-button"
                        onClick={irAPresupuesto}
                      >
                        Ver Detalles Completos
                      </button>
                    </div>
                    
                    <div className="presupuesto-stats">
                      <div className="stat-card aporte-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                          <div className="stat-label">Aporte Mensual</div>
                          <div className="stat-value">
                            ${(presupuestoMesActual.montoAporte || presupuestoMesActual.montoObjetivo).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="stat-card aportado-card">
                        <div className="stat-icon">💵</div>
                        <div className="stat-content">
                          <div className="stat-label">Total Aportado</div>
                          <div className="stat-value">
                            ${aportesMesActual.reduce((sum, a) => sum + a.monto, 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="stat-card pendiente-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                          <div className="stat-label">Pendiente por Aportar</div>
                          <div className="stat-value">
                            ${Math.max(0, (presupuestoMesActual.montoAporte || presupuestoMesActual.montoObjetivo) - 
                              aportesMesActual.reduce((sum, a) => sum + a.monto, 0)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="stat-card numero-card">
                        <div className="stat-icon">🧾</div>
                        <div className="stat-content">
                          <div className="stat-label">Aportes Realizados</div>
                          <div className="stat-value">
                            {aportesMesActual.length}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="progreso-container">
                      <div className="progreso-label">
                        <span>Progreso de Aportes</span>
                        <span className="progreso-porcentaje">
                          {Math.min(
                            (aportesMesActual.reduce((sum, a) => sum + a.monto, 0) / 
                            (presupuestoMesActual.montoAporte || presupuestoMesActual.montoObjetivo)) * 100, 
                            100
                          ).toFixed(0)}%
                        </span>
                      </div>
                      <div className="progreso-barra">
                        <div 
                          className="progreso-relleno"
                          style={{ 
                            width: `${Math.min(
                              (aportesMesActual.reduce((sum, a) => sum + a.monto, 0) / 
                              (presupuestoMesActual.montoAporte || presupuestoMesActual.montoObjetivo)) * 100, 
                              100
                            )}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="aportes-recientes">
                      <div className="aportes-header">
                        <h4>Aportes Recientes</h4>
                        <button 
                          className="ir-presupuesto-button"
                          onClick={irAPresupuesto}
                        >
                          Registrar Aporte
                        </button>
                      </div>
                      
                      {aportesMesActual.length === 0 ? (
                        <div className="empty-state">No hay aportes registrados para este mes</div>
                      ) : (
                        <div className="aportes-lista">
                          {aportesMesActual.slice(0, 5).map(aporte => (
                            <div key={aporte.id} className={`aporte-item ${aporte.tipoPago === 'cuenta' ? 'aporte-cuenta' : ''}`}>
                              <div className="aporte-fecha">{formatoFecha(aporte.fechaAporte)}</div>
                              <div className="aporte-info">
                                <div className="aporte-monto">${aporte.monto.toLocaleString()}</div>
                                {aporte.tipoPago === 'cuenta' && (
                                  <div className="aporte-tipo">Pago de cuenta: {aporte.cuentaNombre}</div>
                                )}
                              </div>
                            </div>
                          ))}
                          {aportesMesActual.length > 5 && (
                            <div className="ver-mas">
                              <button 
                                className="ver-mas-button"
                                onClick={irAPresupuesto}
                              >
                                Ver todos los aportes
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="presupuesto-vacio">
                    <div className="vacio-icon">📊</div>
                    <h3>No hay presupuesto para {formatoMes(mesActual)}</h3>
                    <p>Crea un presupuesto para poder hacer un seguimiento de tus gastos mensuales.</p>
                    <button className="crear-presupuesto-button" onClick={irAPresupuesto}>
                      Crear Presupuesto
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'historial' && (
              <div className="tab-content historial-tab">
                <div className="historial-header">
                  <div className="historial-titulo">
                    <h3>Historial de Pagos</h3>
                    <div className="historial-periodo">Mes anterior: {formatoMes(mesAnterior)}</div>
                  </div>
                </div>
                
                {cuentasMesAnterior.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <p>No hay registros de cuentas para el mes anterior</p>
                  </div>
                ) : (
                  <div className="historial-content">
                    <div className="historial-resumen">
                      <div className="resumen-item">
                        <div className="resumen-valor">{cuentasMesAnterior.length}</div>
                        <div className="resumen-label">Total de Cuentas</div>
                      </div>
                      <div className="resumen-item">
                        <div className="resumen-valor">
                          ${cuentasMesAnterior.reduce((sum, c) => sum + c.monto, 0).toLocaleString()}
                        </div>
                        <div className="resumen-label">Monto Total</div>
                      </div>
                      <div className="resumen-item">
                        <div className="resumen-valor">
                          {cuentasMesAnterior.filter(c => c.estaPagada).length} 
                          <span className="porcentaje">
                            ({((cuentasMesAnterior.filter(c => c.estaPagada).length / cuentasMesAnterior.length) * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <div className="resumen-label">Pagadas</div>
                      </div>
                    </div>
                    
                    <div className="historial-tabla">
                      <div className="historial-tabla-header">
                        <div className="columna nombre">Nombre</div>
                        <div className="columna monto">Monto</div>
                        <div className="columna vencimiento">Vencimiento</div>
                        <div className="columna estado">Estado</div>
                      </div>
                      
                      <div className="historial-tabla-body">
                        {cuentasMesAnterior.map(cuenta => (
                          <div key={cuenta.id} className="historial-fila">
                            <div className="columna nombre">{cuenta.nombre}</div>
                            <div className="columna monto">${cuenta.monto.toLocaleString()}</div>
                            <div className="columna vencimiento">{formatoFecha(cuenta.fechaVencimiento)}</div>
                            <div className="columna estado">
                              <span className={`estado-badge ${cuenta.estaPagada ? 'pagado' : 'pendiente'}`}>
                                {cuenta.estaPagada ? 'Pagado' : 'Pendiente'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {presupuestoMesAnterior && (
                      <div className="historial-presupuesto">
                        <h4>Presupuesto del Mes Anterior</h4>
                        <div className="presupuesto-anterior-info">
                          <div className="info-item">
                            <div className="info-label">Aporte Mensual</div>
                            <div className="info-value">
                              ${(presupuestoMesAnterior.montoAporte || presupuestoMesAnterior.montoObjetivo).toLocaleString()}
                            </div>
                          </div>
                          <div className="info-item">
                            <div className="info-label">Total Aportado</div>
                            <div className="info-value">
                              ${aportesMesAnterior.reduce((sum, a) => sum + a.monto, 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="info-item">
                            <div className="info-label">Objetivo Cumplido</div>
                            <div className="info-value">
                              {Math.min(
                                (aportesMesAnterior.reduce((sum, a) => sum + a.monto, 0) / 
                                (presupuestoMesAnterior.montoAporte || presupuestoMesAnterior.montoObjetivo)) * 100, 
                                100
                              ).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : showPagoForm ? (
          <PagoForm 
            cuenta={selectedCuenta} 
            onSuccess={handlePagoSuccess}
            onCancel={() => {
              setShowPagoForm(false);
              if (selectedCuenta) setShowDetalle(true);
              else setSelectedCuenta(null);
            }}
          />
        ) : (
          <CuentaDetalle 
            cuenta={selectedCuenta}
            onBackClick={handleBackClick}
            onPagoClick={handlePagoClick}
          />
        )}
        
        {cuentasProximasVencer.length > 0 && activeTab !== 'resumen' && (
          <div className="alertas-flotantes">
            <div className="alerta-proximos-vencimientos">
              <span className="alerta-icon">⚠️</span>
              <span>Tienes {cuentasProximasVencer.length} cuenta(s) próxima(s) a vencer</span>
              <button 
                className="ver-alerta-button"
                onClick={() => setActiveTab('resumen')}
              >
                Ver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
