import React, { useEffect, useState } from 'react';
import './PresupuestoDashboard.css';
import NavBar from '../NavBar';
import {
  getPresupuestos,
  getAportes,
  getGastos,
  getDeudas,
  getAhorros,
  getMovimientos,
  createAporte,
  createDeuda,
  createAhorro,
  createPresupuesto,
  deleteAporte,
  deleteAhorro,
  deleteDeuda,
  deleteGasto,
  cerrarMes,
  deletePresupuesto
} from '../../services/presupuesto';
import { Bar } from 'react-chartjs-2';
import { Bar as BarChart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../../contexts/AuthContext';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const formatoMoneda = valor => valor?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

const Tarjeta = ({ titulo, valor, color, clase }) => (
  <div className={`presupuesto-tarjeta ${clase || ''}`} style={{ background: color }}>
    <div>{titulo}</div>
    <div className="valor">{valor}</div>
  </div>
);

const initialForm = { monto: '', comentario: '', usuarioId: '' };

const PresupuestoDashboard = () => {
  const { currentUser } = useAuth();
  // TODOS los hooks de estado deben ir aquí, ANTES de cualquier lógica o return
  const [usuarios, setUsuarios] = useState([]);
  const [presupuesto, setPresupuesto] = useState(null);
  const [aportes, setAportes] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [ahorros, setAhorros] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAporte, setShowAporte] = useState(false);
  const [showDeuda, setShowDeuda] = useState(false);
  const [showAhorro, setShowAhorro] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [accionLoading, setAccionLoading] = useState(false);
  const [accionError, setAccionError] = useState(null);
  const [accionSuccess, setAccionSuccess] = useState(null);
  const [showCrearPresupuesto, setShowCrearPresupuesto] = useState(false);
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState({ montoObjetivo: '', fechaMes: '' });
  const [crearLoading, setCrearLoading] = useState(false);
  const [crearError, setCrearError] = useState(null);
  const [cerrarLoading, setCerrarLoading] = useState(false);
  const [cerrarError, setCerrarError] = useState(null);
  const [cerrarSuccess, setCerrarSuccess] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);
  const [presupuestosDisponibles, setPresupuestosDisponibles] = useState([]);
  const [showDetalleDeuda, setShowDetalleDeuda] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState(null);
  const [pagoForm, setPagoForm] = useState({ monto: '', fecha_pago: '', comentario: '', cuenta_origen: '' });
  const [pagoLoading, setPagoLoading] = useState(false);
  const [pagoError, setPagoError] = useState(null);
  const [pagoSuccess, setPagoSuccess] = useState(null);
  const historialPagosRef = React.useRef(null);

  // Nuevo: cargar todos los presupuestos disponibles al inicio
  useEffect(() => {
    async function fetchPresupuestosDisponibles() {
      try {
        const res = await getPresupuestos();
        setPresupuestosDisponibles(res.data || []);
      } catch {
        setPresupuestosDisponibles([]);
      }
    }
    fetchPresupuestosDisponibles();
  }, []);

  // Nuevo: cargar datos del presupuesto solo si hay mes seleccionado
  useEffect(() => {
    if (!mesSeleccionado) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fechaMes = mesSeleccionado + '-01';
        const resPres = await getPresupuestos({ fecha_mes: fechaMes });
        const presupuestoActivo = resPres.data[0];
        setPresupuesto(presupuestoActivo);
        if (presupuestoActivo) {
          const [resAportes, resGastos, resDeudas, resAhorros, resMov] = await Promise.all([
            getAportes({ presupuesto: presupuestoActivo.id }),
            getGastos({ presupuesto: presupuestoActivo.id }),
            getDeudas({ presupuesto: presupuestoActivo.id }),
            getAhorros({ presupuesto: presupuestoActivo.id }),
            getMovimientos({ presupuesto: presupuestoActivo.id })
          ]);
          setAportes(resAportes.data);
          setGastos(resGastos.data);
          setDeudas(resDeudas.data);
          setAhorros(resAhorros.data);
          setMovimientos(resMov.data);
        } else {
          setAportes([]);
          setGastos([]);
          setDeudas([]);
          setAhorros([]);
          setMovimientos([]);
        }
      } catch (err) {
        setError('Error al cargar los datos de presupuesto');
      }
      setLoading(false);
    };
    fetchData();
  }, [mesSeleccionado]);

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const token = localStorage.getItem('access');
        const res = await fetch('http://localhost:8000/api/usuarios/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsuarios(data);
        } else {
          setUsuarios([]);
        }
      } catch {
        setUsuarios([]);
      }
    }
    fetchUsuarios();
  }, []);

  const recargarDatos = async () => {
    setLoading(true);
    try {
      const mesActual = new Date().toISOString().slice(0, 7) + '-01';
      const resPres = await getPresupuestos({ fecha_mes: mesActual });
      const presupuestoActivo = resPres.data[0];
      setPresupuesto(presupuestoActivo);
      if (presupuestoActivo) {
        const [resAportes, resGastos, resDeudas, resAhorros, resMov] = await Promise.all([
          getAportes({ presupuesto: presupuestoActivo.id }),
          getGastos({ presupuesto: presupuestoActivo.id }),
          getDeudas({ presupuesto: presupuestoActivo.id }),
          getAhorros({ presupuesto: presupuestoActivo.id }),
          getMovimientos({ presupuesto: presupuestoActivo.id })
        ]);
        setAportes(resAportes.data);
        setGastos(resGastos.data);
        setDeudas(resDeudas.data);
        setAhorros(resAhorros.data);
        setMovimientos(resMov.data);
      }
    } catch (err) {
      setError('Error al recargar los datos de presupuesto');
    }
    setLoading(false);
  };

  const handleCerrarMes = async () => {
    if (!presupuesto?.id) return;
    if (!window.confirm('¿Estás seguro de que deseas cerrar el mes? Esta acción es irreversible.')) return;
    setCerrarLoading(true); setCerrarError(null); setCerrarSuccess(null);
    try {
      await cerrarMes(presupuesto.id);
      setCerrarSuccess('¡Mes cerrado correctamente!');
      await recargarDatos();
    } catch (e) {
      setCerrarError('Error al cerrar el mes');
    }
    setCerrarLoading(false);
  };

  // Handlers para formularios
  const handleInputChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAporte = async () => {
    setAccionLoading(true); setAccionError(null); setAccionSuccess(null);
    try {
      const usuarioId = form.usuarioId || currentUser?.id;
      const nombreAportador = usuarios.find(u => u.id === usuarioId)?.username || currentUser?.username;
      await createAporte({
        ...form,
        presupuesto: presupuesto.id,
        usuario: usuarioId,
        nombre_aportador: nombreAportador
      });
      setShowAporte(false); setForm(initialForm); setAccionSuccess('Aporte registrado');
      await recargarDatos();
    } catch (e) { setAccionError('Error al registrar aporte'); }
    setAccionLoading(false);
  };

  const handleDeuda = async () => {
    setAccionLoading(true); setAccionError(null); setAccionSuccess(null);
    try {
      let payload = { ...form, presupuesto: presupuesto.id };
      // Si hay archivo, el servicio lo detecta y arma FormData
      await createDeuda(payload);
      setShowDeuda(false); setForm(initialForm); setAccionSuccess('Deuda registrada');
      await recargarDatos();
    } catch (e) {
      // Mostrar el error real del backend si existe
      setAccionError(e.response?.data ? JSON.stringify(e.response.data) : 'Error al registrar deuda');
    }
    setAccionLoading(false);
  };
  const handleAhorro = async () => {
    setAccionLoading(true); setAccionError(null); setAccionSuccess(null);
    try {
      await createAhorro({ ...form, presupuesto: presupuesto.id });
      setShowAhorro(false); setForm(initialForm); setAccionSuccess('Ahorro registrado');
      await recargarDatos();
    } catch (e) { setAccionError('Error al registrar ahorro'); }
    setAccionLoading(false);
  };

  const handleEliminarAporte = async (aporteId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este aporte?')) return;
    setAccionLoading(true); setAccionError(null); setAccionSuccess(null);
    try {
      await deleteAporte(aporteId);
      setAccionSuccess('Aporte eliminado');
      await recargarDatos();
    } catch (e) { setAccionError('Error al eliminar el aporte'); }
    setAccionLoading(false);
  };

  const handleEliminarAhorro = async (ahorroId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este ahorro?')) return;
    setAccionLoading(true); setAccionError(null); setAccionSuccess(null);
    try {
      await deleteAhorro(ahorroId);
      setAccionSuccess('Ahorro eliminado');
      await recargarDatos();
    } catch (e) { setAccionError('Error al eliminar el ahorro'); }
    setAccionLoading(false);
  };

  const handleEliminarDeuda = async (deudaId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta deuda?')) return;
    setAccionLoading(true); setAccionError(null); setAccionSuccess(null);
    try {
      await deleteDeuda(deudaId);
      setAccionSuccess('Deuda eliminada');
      await recargarDatos();
    } catch (e) { setAccionError('Error al eliminar la deuda'); }
    setAccionLoading(false);
  };

  const handleEliminarGasto = async (gastoId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este gasto?')) return;
    setAccionLoading(true); setAccionError(null); setAccionSuccess(null);
    try {
      await deleteGasto(gastoId);
      setAccionSuccess('Gasto eliminado');
      await recargarDatos();
    } catch (e) { setAccionError('Error al eliminar el gasto'); }
    setAccionLoading(false);
  };

  // Handler para eliminar presupuesto
  const handleEliminarPresupuesto = async () => {
    if (!presupuesto?.id) return;
    if (!window.confirm('¿Seguro que deseas eliminar este presupuesto? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    setError(null);
    try {
      await deletePresupuesto(presupuesto.id);
      setPresupuesto(null);
      setMesSeleccionado(null);
      // Recargar lista de presupuestos disponibles
      const res = await getPresupuestos();
      setPresupuestosDisponibles(res.data || []);
    } catch (e) {
      setError('Error al eliminar el presupuesto');
    }
    setLoading(false);
  };

  // Nuevo: pantalla de selección de mes
  if (!mesSeleccionado) {
    // Obtener meses únicos de presupuestos existentes
    const meses = presupuestosDisponibles.map(p => p.fechaMes?.slice(0,7)).filter(Boolean);
    const mesesUnicos = Array.from(new Set(meses)).sort((a,b) => b.localeCompare(a));
    const mesActual = new Date().toISOString().slice(0,7);
    const mesesNombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const formatoMes = (ym) => {
      if (!ym) return '';
      const [y, m] = ym.split('-');
      return `${mesesNombres[parseInt(m,10)-1]} ${y}`;
    };

    return (
      <>
        <NavBar />
        <div className="presupuesto-dashboard">
          <div className="presupuesto-panel presupuesto-mes-selector" style={{maxWidth:440,margin:'40px auto',padding:'40px 32px',background:'#fff',borderRadius:18,boxShadow:'0 4px 24px #0002'}}>
            <h2 style={{textAlign:'center',marginBottom:18,fontWeight:800,letterSpacing:0.5}}>Selecciona un mes</h2>
            <p style={{textAlign:'center',color:'#888',marginBottom:28}}>Consulta o crea tu presupuesto mensual familiar.</p>
            <div style={{display:'flex',flexDirection:'column',gap:18,marginBottom:28}}>
              {mesesUnicos.length === 0 && <div style={{color:'#888',textAlign:'center'}}>No hay presupuestos creados aún.</div>}
              {mesesUnicos.map(mes => (
                <button key={mes} onClick={()=>setMesSeleccionado(mes)} style={{padding:'16px 0',borderRadius:10,border:'none',background:'#607d8b',color:'#fff',fontWeight:700,fontSize:'1.15em',boxShadow:'0 2px 8px #0002',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,transition:'background 0.2s'}}>
                  <span style={{fontSize:'1.3em'}}><i className="fas fa-calendar-alt"></i></span>
                  {mes === mesActual ? <b>Mes actual: {formatoMes(mes)}</b> : formatoMes(mes)}
                </button>
              ))}
            </div>
            <div style={{margin:'24px 0 12px',textAlign:'center',color:'#888',fontWeight:500}}>O elige otro mes</div>
            <div style={{display:'flex',justifyContent:'center'}}>
              <ReactDatePicker
                selected={null}
                onChange={date => {
                  const year = date.getFullYear();
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  setMesSeleccionado(`${year}-${month}`);
                }}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                showFullMonthYearPicker
                placeholderText="Selecciona mes y año"
                className="react-datepicker__input-text"
                style={{width:'180px',marginBottom:8,padding:10,borderRadius:8,border:'1px solid #ddd',fontSize:'1.1em',textAlign:'center'}}
              />
            </div>
            <div style={{marginTop:18,textAlign:'center',color:'#bbb',fontSize:13}}>
              <i className="fas fa-info-circle"></i> Puedes crear un presupuesto para cualquier mes.
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) return <><NavBar /><div className="presupuesto-dashboard"><div className="presupuesto-panel">Cargando presupuesto...</div></div></>;
  if (error) return <><NavBar /><div className="presupuesto-dashboard"><div className="presupuesto-panel" style={{ color: 'red' }}>{error}</div></div></>;
  if (!presupuesto) return (
    <>
      <NavBar />
      <div className="presupuesto-dashboard">
        <div className="presupuesto-panel">
          <div>No hay presupuesto para este mes.</div>
          <button
            style={{
              marginTop: 20,
              background: 'linear-gradient(90deg,#43a047 80%,#66bb6a 100%)',
              color: '#fff',
              padding: '14px 28px',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '1.1rem',
              boxShadow: '0 2px 8px #0002',
              letterSpacing: 1,
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.2s',
            }}
            onClick={() => setShowCrearPresupuesto(true)}
            onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg,#388e3c 80%,#43a047 100%)'}
            onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg,#43a047 80%,#66bb6a 100%)'}
          >
            <span style={{fontSize:'1.3em',marginRight:8}}>＋</span>Crear Presupuesto Mensual
          </button>
          {showCrearPresupuesto && (
            <div className="presupuesto-modal-bg" style={{display: 'flex'}}>
              <div className="presupuesto-modal">
                <button className="presupuesto-modal-close" onClick={()=>setShowCrearPresupuesto(false)}>×</button>
                <h3 style={{textAlign:'center',marginBottom:18}}>Crear Presupuesto Mensual</h3>
                <div style={{marginBottom:16}}>
                  <label style={{fontWeight:600,display:'block',marginBottom:4}}>Monto objetivo (CLP)</label>
                  <input
                    name="montoObjetivo"
                    type="number"
                    placeholder="Ej: 500000"
                    value={nuevoPresupuesto.montoObjetivo}
                    onChange={e => setNuevoPresupuesto({ ...nuevoPresupuesto, montoObjetivo: e.target.value })}
                    style={{width:'100%',marginBottom:8,padding:10,borderRadius:6,border:'1px solid #ddd',fontSize:'1.1em'}}
                  />
                </div>
                <div style={{marginBottom:18}}>
                  <label style={{fontWeight:600,display:'block',marginBottom:4}}>Mes</label>
                  {/* Calendario visual para seleccionar mes y año */}
                  <ReactDatePicker
                    selected={nuevoPresupuesto.fechaMes ? new Date(nuevoPresupuesto.fechaMes + '-01') : null}
                    onChange={date => {
                      // Guardar como YYYY-MM
                      const year = date.getFullYear();
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      setNuevoPresupuesto({ ...nuevoPresupuesto, fechaMes: `${year}-${month}` });
                    }}
                    dateFormat="MM/yyyy"
                    showMonthYearPicker
                    showFullMonthYearPicker
                    placeholderText="Selecciona mes y año"
                    className="react-datepicker__input-text"
                    style={{width:'100%',marginBottom:8,padding:10,borderRadius:6,border:'1px solid #ddd',fontSize:'1.1em'}}
                  />
                </div>
                <button
                  onClick={async () => {
                    setCrearLoading(true); setCrearError(null);
                    try {
                      const fechaMes = nuevoPresupuesto.fechaMes ? `${nuevoPresupuesto.fechaMes}-01` : new Date().toISOString().slice(0,7) + '-01';
                      await createPresupuesto({
                        monto_objetivo: Number(nuevoPresupuesto.montoObjetivo),
                        fecha_mes: fechaMes,
                        familia: "familia_camnr"
                      });
                      setShowCrearPresupuesto(false);
                      setNuevoPresupuesto({ montoObjetivo: '', fechaMes: '' });
                      await recargarDatos();
                    } catch (e) {
                      // Mostrar el error real del backend si existe
                      setCrearError(e.response?.data ? JSON.stringify(e.response.data) : 'Error al crear presupuesto');
                    }
                    setCrearLoading(false);
                  }}
                  disabled={crearLoading || !nuevoPresupuesto.montoObjetivo || !nuevoPresupuesto.fechaMes}
                  style={{width:'100%',background:'linear-gradient(90deg,#43a047 80%,#66bb6a 100%)',color:'#fff',padding:12,border:'none',borderRadius:8,marginBottom:8,fontWeight:700,fontSize:'1.1em',boxShadow:'0 2px 8px #0002',cursor:'pointer'}}
                >
                  {crearLoading ? 'Creando...' : 'Crear'}
                </button>
                {crearError && <div className="presupuesto-feedback-error">{crearError}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Cálculos
  const totalAportado = aportes.reduce((sum, a) => sum + parseFloat(a.monto), 0);
  const totalGastado = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0); // Solo gastos = pagos de cuentas
  const totalAhorrado = ahorros.reduce((sum, a) => sum + parseFloat(a.monto), 0);
  const totalDeuda = deudas.filter(d => !d.pagado).reduce((sum, d) => sum + parseFloat(d.monto), 0);
  // Solo considerar gastos como dinero ocupado
  const saldoAportes = Math.max(0, totalAportado - totalGastado);

  // --- NUEVO: Gráfico de aportes por usuario ---
  const resumenAportesPorUsuario = {};
  aportes.forEach(a => {
    const nombre = a.nombreAportador || a.usuarioUsername || 'Sin nombre';
    resumenAportesPorUsuario[nombre] = (resumenAportesPorUsuario[nombre] || 0) + parseFloat(a.monto);
  });
  const usuariosAporte = Object.keys(resumenAportesPorUsuario);
  const montosAporte = usuariosAporte.map(u => resumenAportesPorUsuario[u]);
  // Obtener color personalizado de cada usuario (si existe)
  const getColorUsuario = (nombre) => {
    const user = usuarios.find(u => u.username === nombre);
    return user?.color || '#4caf50';
  };
  const coloresAportePersonalizados = usuariosAporte.map(nombre => getColorUsuario(nombre));
  const dataAportesPorUsuario = {
    labels: usuariosAporte,
    datasets: [
      {
        label: 'Aportado',
        data: montosAporte,
        backgroundColor: coloresAportePersonalizados,
        borderRadius: 6,
      },
    ],
  };
  const optionsAportesPorUsuario = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Aportes por Usuario' },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => formatoMoneda(v) } },
      x: { grid: { display: false } },
    },
  };

  // El gráfico solo muestra aportes restantes vs. gastados en cuentas
  const dataBar = {
    labels: ['Aportes Restantes', 'Aportes Ocupados (pagos de cuentas)'],
    datasets: [
      {
        label: 'CLP',
        data: [saldoAportes, totalGastado],
        backgroundColor: ['#4caf50', '#f44336'],
        borderRadius: 6,
      },
    ],
  };
  const optionsBar = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Estado de los Aportes' },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => formatoMoneda(v) } },
      x: { grid: { display: false } },
    },
  };

  // Ordenar movimientos del más reciente al más antiguo
  const movimientosOrdenados = [...movimientos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // Función para abrir el modal de detalle de deuda
  const handleVerDetalleDeuda = (deuda) => {
    setDeudaSeleccionada(deuda);
    setShowDetalleDeuda(true);
  };

  const handlePagoInput = e => setPagoForm({ ...pagoForm, [e.target.name]: e.target.value });

  const handleRegistrarPago = async () => {
    setPagoLoading(true); setPagoError(null); setPagoSuccess(null);
    try {
      const { createPagoDeuda } = await import('../../services/presupuesto');
      // Si no hay fecha seleccionada, usar la fecha actual
      const fechaPago = pagoForm.fecha_pago || new Date().toISOString().slice(0, 10);
      await createPagoDeuda({
        deuda: deudaSeleccionada.id,
        monto_pagado: pagoForm.monto,
        fecha_pago: fechaPago,
        comentario: pagoForm.comentario,
        cuenta_origen: pagoForm.cuenta_origen || null
      });
      setPagoSuccess('¡Pago registrado exitosamente!');
      setPagoForm({ monto: '', fecha_pago: '', comentario: '', cuenta_origen: '' });
      setTimeout(async () => {
        await recargarDatos();
        setShowDetalleDeuda(false);
        setPagoSuccess(null);
      }, 1200);
      // Scroll al historial de pagos
      setTimeout(() => {
        if (historialPagosRef.current) {
          historialPagosRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    } catch (e) {
      setPagoError('Error al registrar el pago');
    }
    setPagoLoading(false);
  };

  return (
    <>
      <NavBar />
      <div className="presupuesto-dashboard responsive-dashboard">
        <div className="presupuesto-panel responsive-panel">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <h2 style={{margin:0}}>Presupuesto Familiar - {presupuesto.fechaMes ? presupuesto.fechaMes.slice(0,7) : ''}</h2>
            <div style={{display:'flex',gap:8}}>
              <button
                onClick={handleCerrarMes}
                disabled={cerrarLoading}
                style={{
                  background: '#607d8b',
                  color: '#fff',
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  boxShadow: '0 1px 4px #0002',
                  fontSize: '0.92em',
                  cursor: 'pointer',
                  minWidth: 0,
                  minHeight: 0,
                  lineHeight: 1.2,
                  transition: 'background 0.2s, box-shadow 0.2s',
                  opacity: cerrarLoading ? 0.7 : 1,
                  marginLeft: 8
                }}
              >
                {cerrarLoading ? 'Cerrando...' : 'Cerrar mes'}
              </button>
              <button
                onClick={handleEliminarPresupuesto}
                style={{
                  background: '#e53935',
                  color: '#fff',
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  boxShadow: '0 1px 4px #0002',
                  fontSize: '0.92em',
                  cursor: 'pointer',
                  minWidth: 0,
                  minHeight: 0,
                  lineHeight: 1.2,
                  transition: 'background 0.2s, box-shadow 0.2s',
                  marginLeft: 8
                }}
              >
                Eliminar presupuesto
              </button>
            </div>
          </div>
          {cerrarError && <div className="presupuesto-feedback-error">{cerrarError}</div>}
          {cerrarSuccess && <div className="presupuesto-feedback-success">{cerrarSuccess}</div>}
          <div className="presupuesto-tarjetas responsive-tarjetas">
            <Tarjeta titulo="Aportado" valor={formatoMoneda(totalAportado)} color="#4caf50" clase="tarjeta-aportado" />
            <Tarjeta titulo="Gastado" valor={formatoMoneda(totalGastado)} color="#f44336" clase="tarjeta-gastado" />
            <Tarjeta titulo="Ahorrado" valor={formatoMoneda(totalAhorrado)} color="#2196f3" clase="tarjeta-ahorrado" />
            <Tarjeta titulo="Deuda activa" valor={formatoMoneda(totalDeuda)} color="#ff9800" clase="tarjeta-deuda" />
            <Tarjeta titulo="Sobrante" valor={formatoMoneda(saldoAportes)} color="#607d8b" clase="tarjeta-sobrante" />
          </div>
          {/* Gráfico de barras en vez de barra de progreso */}
          <div className="responsive-chart-container" style={{maxWidth: 480, margin: '24px auto 0', width: '100%', overflowX: 'auto'}}>
            <Bar data={dataBar} options={optionsBar} />
          </div>
          {/* Gráfico de aportes por usuario */}
          <div className="responsive-chart-container" style={{maxWidth: 480, margin: '24px auto', width: '100%', overflowX: 'auto'}}>
            <BarChart data={dataAportesPorUsuario} options={optionsAportesPorUsuario} />
          </div>
          <div className="presupuesto-acciones responsive-acciones">
            <button style={{background:'#4caf50'}} onClick={()=>setShowAporte(true)}>Agregar Aporte</button>
            <button style={{background:'#ff9800'}} onClick={()=>setShowDeuda(true)}>Registrar Deuda</button>
            <button style={{background:'#2196f3'}} onClick={()=>setShowAhorro(true)}>Registrar Ahorro</button>
          </div>
          {accionError && <div className="presupuesto-feedback-error">{accionError}</div>}
          {accionSuccess && <div className="presupuesto-feedback-success">{accionSuccess}</div>}

          {/* Botón para volver a la selección de mes */}
          <div style={{marginBottom:16}}>
            <button onClick={()=>setMesSeleccionado(null)} style={{background:'#eee',color:'#607d8b',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:600,cursor:'pointer',fontSize:'0.98em'}}>Cambiar mes</button>
          </div>

          {/* Listados detallados */}
          <div className="presupuesto-listados responsive-listados">
            <div className="presupuesto-listado-col">
              <h4>Aportes</h4>
              <ul className="presupuesto-lista">
                {aportes.length === 0 && <li style={{color:'#888'}}>No hay aportes registrados.</li>}
                {aportes.map(a => (
                  <li key={a.id}>
                    <b>{formatoMoneda(a.monto)}</b> por {a.nombreAportador || a.usuarioUsername || 'Sin nombre'}
                    {a.comentario && <span style={{color:'#888'}}> — {a.comentario}</span>}
                    <button style={{marginLeft:8, color:'#fff', background:'#e53935', border:'none', borderRadius:4, padding:'2px 8px', fontSize:'0.95em', cursor:'pointer'}}
                      onClick={() => handleEliminarAporte(a.id)} disabled={accionLoading}>
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="presupuesto-listado-col">
              <h4>Gastos</h4>
              <ul className="presupuesto-lista">
                {gastos.length === 0 && <li style={{color:'#888'}}>No hay gastos registrados.</li>}
                {gastos.map(g => (
                  <li key={g.id} style={{display:'flex',alignItems:'center',gap:8}}>
                    {/* Icono según categoría de gasto */}
                    {(() => {
                      // Usar la categoría real del gasto para el ícono
                      const categoria = (g.categoria_nombre || g.categoria || '').toLowerCase();
                      if (categoria.includes('agua')) return <span title="Agua" style={{fontSize:20}}>💧</span>;
                      if (categoria.includes('luz') || categoria.includes('electricidad')) return <span title="Luz" style={{fontSize:20}}>💡</span>;
                      if (categoria.includes('gas')) return <span title="Gas" style={{fontSize:20}}>🔥</span>;
                      if (categoria.includes('internet')) return <span title="Internet" style={{fontSize:20}}>🌐</span>;
                      if (categoria.includes('arriendo') || categoria.includes('renta')) return <span title="Arriendo" style={{fontSize:20}}>🏠</span>;
                      if (categoria.includes('telefono')) return <span title="Teléfono" style={{fontSize:20}}>📞</span>;
                      if (categoria.includes('colegio') || categoria.includes('educacion')) return <span title="Educación" style={{fontSize:20}}>🎓</span>;
                      if (categoria.includes('salud') || categoria.includes('isapre') || categoria.includes('fonasa')) return <span title="Salud" style={{fontSize:20}}>🩺</span>;
                      if (categoria.includes('supermercado') || categoria.includes('comida')) return <span title="Supermercado" style={{fontSize:20}}>🛒</span>;
                      return <span title="Otro" style={{fontSize:20}}>💸</span>;
                    })()}
                    <b>{formatoMoneda(g.monto)}</b>
                    {g.cuenta_nombre && <span style={{color:'#888'}}> — {g.cuenta_nombre}</span>}
                    {g.descripcion && <span style={{color:'#888'}}> — {g.descripcion}</span>}
                    <button style={{marginLeft:8, color:'#fff', background:'#e53935', border:'none', borderRadius:4, padding:'2px 8px', fontSize:'0.95em', cursor:'pointer'}}
                      onClick={() => handleEliminarGasto(g.id)} disabled={accionLoading}>
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="presupuesto-listado-col">
              <h4>Ahorros</h4>
              <ul className="presupuesto-lista">
                {ahorros.length === 0 && <li style={{color:'#888'}}>No hay ahorros registrados.</li>}
                {ahorros.map(a => (
                  <li key={a.id}>
                    <b>{formatoMoneda(a.monto)}</b> {a.comentario && <span style={{color:'#888'}}>— {a.comentario}</span>}
                    <button style={{marginLeft:8, color:'#fff', background:'#2196f3', border:'none', borderRadius:4, padding:'2px 8px', fontSize:'0.95em', cursor:'pointer'}}
                      onClick={() => handleEliminarAhorro(a.id)} disabled={accionLoading}>
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="presupuesto-listado-col">
              <h4>Deudas</h4>
              <ul className="presupuesto-lista">
                {deudas.length === 0 && <li style={{color:'#888'}}>No hay deudas registradas.</li>}
                {deudas.map(d => (
                  <li key={d.id} style={{background:'#fff',borderRadius:10,boxShadow:'0 1px 6px #0001',marginBottom:10,padding:'10px 12px',display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:22}} title="Deuda">💳</span>
                      <b>{d.motivo || 'Deuda'}</b>
                      <span style={{color:d.pagado ? '#43a047' : '#e53935',fontWeight:600,marginLeft:8}}>
                        {d.pagado ? '(Pagada)' : '(Pendiente)'}
                      </span>
                    </div>
                    <div style={{fontSize:15}}>{formatoMoneda(d.monto)}
                      {d.categoria && <span style={{color:'#888'}}> — {d.categoria}</span>}
                    </div>
                    <div style={{fontSize:13,color:'#888'}}>
                      {d.cuotas_totales > 1 ? `${d.cuotas_pagadas||0} de ${d.cuotas_totales} cuotas pagadas` : 'Pago único'}
                    </div>
                    {/* Barra de progreso */}
                    <div style={{background:'#eee',borderRadius:6,height:8,overflow:'hidden',margin:'2px 0'}}>
                      <div style={{background:d.pagado ? '#43a047' : '#ff9800',height:8,width:`${d.porcentaje_pagado_cuotas||0}%`,transition:'width 0.3s'}}></div>
                    </div>
                    <div style={{fontSize:12,color:'#888'}}>
                      {d.fecha_fin_estimado && <span>Proyección fin: {d.fecha_fin_estimado}</span>}
                    </div>
                    <div style={{display:'flex',gap:8,marginTop:4}}>
                      <button style={{background:'#2196f3',color:'#fff',border:'none',borderRadius:4,padding:'2px 10px',fontSize:'0.95em',cursor:'pointer'}}
                        onClick={()=>handleVerDetalleDeuda(d)}>
                        Ver detalle / Pagar cuota
                      </button>
                      <button style={{background:'#ff9800',color:'#fff',border:'none',borderRadius:4,padding:'2px 10px',fontSize:'0.95em',cursor:'pointer'}}
                        onClick={()=>handleEliminarDeuda(d.id)} disabled={accionLoading}>
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Historial de movimientos */}
          <div className="presupuesto-historial responsive-historial">
            <h4>Historial de Movimientos</h4>
            {movimientosOrdenados.length === 0 ? (
              <ul className="presupuesto-lista"><li style={{color:'#888'}}>No hay movimientos registrados.</li></ul>
            ) : (
              <>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {movimientosOrdenados.slice(0,3).map(m => (
                    <div key={m.id} className="movimiento-tarjeta" style={{background:'#f7f9fb',borderRadius:10,padding:12,boxShadow:'0 2px 8px rgba(25,118,210,0.07)'}}>
                      <div style={{fontWeight:600,color:'#1976d2'}}>{m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)}</div>
                      <div style={{fontSize:15}}>{formatoMoneda(m.monto)}</div>
                      {m.descripcion && <div style={{color:'#888',fontSize:13,marginTop:2}}>{m.descripcion}</div>}
                      <div style={{color:'#888',fontSize:12,marginTop:4}}>{new Date(m.fecha).toLocaleString('es-CL')}</div>
                    </div>
                  ))}
                </div>
                {movimientosOrdenados.length > 3 && (
                  <details style={{marginTop:12}}>
                    <summary style={{cursor:'pointer',color:'#1976d2',fontWeight:600,fontSize:15}}>
                      Ver más movimientos ({movimientosOrdenados.length - 3} más)
                    </summary>
                    <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:8}}>
                      {movimientosOrdenados.slice(3).map(m => (
                        <div key={m.id} className="movimiento-tarjeta" style={{background:'#f7f9fb',borderRadius:10,padding:12,boxShadow:'0 2px 8px rgba(25,118,210,0.07)'}}>
                          <div style={{fontWeight:600,color:'#1976d2'}}>{m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)}</div>
                          <div style={{fontSize:15}}>{formatoMoneda(m.monto)}</div>
                          {m.descripcion && <div style={{color:'#888',fontSize:13,marginTop:2}}>{m.descripcion}</div>}
                          <div style={{color:'#888',fontSize:12,marginTop:4}}>{new Date(m.fecha).toLocaleString('es-CL')}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>

          {/* Modales para formularios */}
          <div className="presupuesto-modal-bg responsive-modal-bg" style={{display: showAporte ? 'flex' : 'none'}}>
            <div className="presupuesto-modal responsive-modal">
              <button className="presupuesto-modal-close" onClick={()=>setShowAporte(false)}>×</button>
              <h3>Agregar Aporte</h3>
              <input name="monto" type="number" placeholder="Monto" value={form.monto} onChange={handleInputChange} style={{width:'100%',marginBottom:12}} />
              <input name="comentario" placeholder="Comentario" value={form.comentario} onChange={handleInputChange} style={{width:'100%',marginBottom:12}} />
              <label>Aportado por</label>
              <select
                name="usuarioId"
                value={form.usuarioId || currentUser?.id || ''}
                onChange={handleInputChange}
                style={{width:'100%',marginBottom:12}}
              >
                {usuarios.length === 0 && (
                  <option value={currentUser?.id || ''}>{currentUser?.username || 'Tú'}</option>
                )}
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
              <button onClick={handleAporte} disabled={accionLoading} style={{width:'100%',background:'#4caf50',color:'#fff',padding:10,border:'none',borderRadius:6}}>
                {accionLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
          <div className="presupuesto-modal-bg responsive-modal-bg" style={{display: showDeuda ? 'flex' : 'none'}}>
            <div className="presupuesto-modal responsive-modal" style={{maxWidth:480}}>
              <button className="presupuesto-modal-close" onClick={()=>setShowDeuda(false)}>×</button>
              <h3>Registrar Deuda</h3>
              <input name="monto" type="number" placeholder="Monto total" value={form.monto} onChange={handleInputChange} style={{width:'100%',marginBottom:10}} />
              <input name="motivo" placeholder="Motivo o descripción" value={form.motivo||''} onChange={handleInputChange} style={{width:'100%',marginBottom:10}} />
              <input name="cuotas_totales" type="number" min="1" placeholder="N° de cuotas" value={form.cuotas_totales||''} onChange={handleInputChange} style={{width:'100%',marginBottom:10}} />
              <select name="frecuencia" value={form.frecuencia||'mensual'} onChange={handleInputChange} style={{width:'100%',marginBottom:10}}>
                <option value="mensual">Mensual</option>
                <option value="quincenal">Quincenal</option>
                <option value="semanal">Semanal</option>
              </select>
              {/* Mostrar valor de cada cuota en tiempo real si hay cuotas y monto */}
              {form.cuotas_totales > 1 && form.monto && !isNaN(form.cuotas_totales) && !isNaN(form.monto) && (
                <div style={{margin:'6px 0 10px 0',fontSize:14,color:'#607d8b'}}>
                  <b>Valor de cada cuota:</b> {formatoMoneda(Math.round(Number(form.monto)/Number(form.cuotas_totales)))}
                  <span style={{color:'#888',marginLeft:8}}>
                    {form.frecuencia ? `(${form.frecuencia.charAt(0).toUpperCase() + form.frecuencia.slice(1)})` : ''}
                  </span>
                </div>
              )}
              <label style={{fontSize:13,marginBottom:2}}>Fecha de inicio</label>
              <input name="fecha_inicio" type="date" value={form.fecha_inicio||''} onChange={handleInputChange} style={{width:'100%',marginBottom:10}} />
              <input name="categoria" placeholder="Categoría (opcional)" value={form.categoria||''} onChange={handleInputChange} style={{width:'100%',marginBottom:10}} />
              <label style={{fontSize:13,marginBottom:2}}>Adjuntar documento (opcional)</label>
              <input name="documento" type="file" onChange={e=>setForm({...form, documento: e.target.files[0]})} style={{width:'100%',marginBottom:10}} />
              <textarea name="comentario" placeholder="Comentario (opcional)" value={form.comentario||''} onChange={handleInputChange} style={{width:'100%',marginBottom:10}} />
              {/* Proyección de fin y barra de progreso */}
              {form.cuotas_totales > 1 && form.fecha_inicio && (
                <div style={{margin:'10px 0'}}>
                  <span style={{fontSize:13}}>Proyección de término: <b>{/* Aquí se puede calcular y mostrar la fecha estimada */}</b></span>
                </div>
              )}
              {/* Barra de progreso visual */}
              {form.cuotas_totales > 1 && (
                <div style={{margin:'10px 0'}}>
                  <div style={{background:'#eee',borderRadius:6,height:10,overflow:'hidden'}}>
                    <div style={{background:'#ff9800',height:10,width:`${form.cuotas_pagadas ? (100*form.cuotas_pagadas/form.cuotas_totales) : 0}%`,transition:'width 0.3s'}}></div>
                  </div>
                  <div style={{fontSize:13,marginTop:2}}>{form.cuotas_pagadas||0} de {form.cuotas_totales||1} cuotas pagadas</div>
                </div>
              )}
              <button onClick={handleDeuda} disabled={accionLoading} style={{width:'100%',background:'#ff9800',color:'#fff',padding:10,border:'none',borderRadius:6,marginTop:8}}>
                {accionLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
          <div className="presupuesto-modal-bg responsive-modal-bg" style={{display: showAhorro ? 'flex' : 'none'}}>
            <div className="presupuesto-modal responsive-modal">
              <button className="presupuesto-modal-close" onClick={()=>setShowAhorro(false)}>×</button>
              <h3>Registrar Ahorro</h3>
              <input name="monto" type="number" placeholder="Monto" value={form.monto} onChange={handleInputChange} style={{width:'100%',marginBottom:12}} />
              <input name="comentario" placeholder="Comentario" value={form.comentario} onChange={handleInputChange} style={{width:'100%',marginBottom:12}} />
              <button onClick={handleAhorro} disabled={accionLoading} style={{width:'100%',background:'#2196f3',color:'#fff',padding:10,border:'none',borderRadius:6}}>
                {accionLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
          {showDetalleDeuda && deudaSeleccionada && (
            <div className="presupuesto-modal-bg responsive-modal-bg" style={{display:'flex'}}>
              <div className="presupuesto-modal responsive-modal" style={{maxWidth:520}}>
                <button className="presupuesto-modal-close" onClick={()=>setShowDetalleDeuda(false)}>×</button>
                <h3>Detalle de Deuda</h3>
                {pagoSuccess && <div style={{background:'#e8f5e9',color:'#388e3c',padding:'8px 0',borderRadius:6,marginBottom:8,textAlign:'center',fontWeight:600}}>{pagoSuccess}</div>}
                <div style={{marginBottom:10}}>
                  <b>{deudaSeleccionada.motivo || 'Deuda'}</b> {deudaSeleccionada.pagado ? <span style={{color:'#43a047'}}>(Pagada)</span> : <span style={{color:'#e53935'}}>(Pendiente)</span>}
                </div>
                <div style={{fontSize:15,marginBottom:6}}>{formatoMoneda(deudaSeleccionada.monto)}
                  {deudaSeleccionada.categoria && <span style={{color:'#888'}}> — {deudaSeleccionada.categoria}</span>}
                </div>
                <div style={{fontSize:13,color:'#888',marginBottom:6}}>
                  {deudaSeleccionada.cuotas_totales > 1 ? `${deudaSeleccionada.cuotas_pagadas||0} de ${deudaSeleccionada.cuotas_totales} cuotas pagadas` : 'Pago único'}
                </div>
                {/* Cálculo automático de valor de cuota */}
                {deudaSeleccionada.cuotas_totales > 1 && (
                  <div style={{fontSize:14,marginBottom:6}}>
                    <b>Valor de cada cuota:</b> {formatoMoneda(Math.round((deudaSeleccionada.monto / deudaSeleccionada.cuotas_totales) || 0))}
                    <span style={{color:'#888',marginLeft:8}}>
                      {deudaSeleccionada.frecuencia ? `(${deudaSeleccionada.frecuencia.charAt(0).toUpperCase() + deudaSeleccionada.frecuencia.slice(1)})` : ''}
                    </span>
                  </div>
                )}
                {/* Barra de progreso */}
                <div style={{background:'#eee',borderRadius:6,height:8,overflow:'hidden',margin:'2px 0 10px 0'}}>
                  <div style={{background:deudaSeleccionada.pagado ? '#43a047' : '#ff9800',height:8,width:`${deudaSeleccionada.porcentaje_pagado_cuotas||0}%`,transition:'width 0.3s'}}></div>
                </div>
                <div style={{fontSize:12,color:'#888',marginBottom:10}}>
                  {deudaSeleccionada.fecha_fin_estimado && <span>Proyección fin: {deudaSeleccionada.fecha_fin_estimado}</span>}
                </div>
                {/* Historial de pagos con scroll automático */}
                <div style={{margin:'18px 0 0 0',fontSize:15}} ref={historialPagosRef}>
                  <b>Historial de Pagos</b>
                  <ul style={{margin:'8px 0 0 0',padding:0,listStyle:'none',maxHeight:120,overflowY:'auto'}}>
                    {deudaSeleccionada.pagos && deudaSeleccionada.pagos.length > 0 ? deudaSeleccionada.pagos.map(p => (
                      <li key={p.id} style={{background:'#f7f9fb',borderRadius:6,padding:'6px 10px',marginBottom:4,fontSize:14}}>
                        <span style={{color:'#43a047',fontWeight:600}}>{formatoMoneda(p.monto)}</span> — {p.fecha_pago}
                        {p.comentario && <span style={{color:'#888'}}> — {p.comentario}</span>}
                      </li>
                    )) : <li style={{color:'#888'}}>No hay pagos registrados.</li>}
                  </ul>
                </div>
                {/* Formulario para registrar un nuevo pago de cuota */}
                {!deudaSeleccionada.pagada && (
                  <div style={{marginTop:18,background:'#f7f9fb',borderRadius:8,padding:'12px 10px'}}>
                    <b>Registrar pago de cuota</b>
                    <div style={{fontSize:13, color:'#888', marginTop:4, marginBottom:6}}>
                      {deudaSeleccionada.cuotas_totales > 1 ? (
                        <>Cuota N° <b>{(deudaSeleccionada.cuotas_pagadas || 0) + 1}</b> de <b>{deudaSeleccionada.cuotas_totales}</b></>
                      ) : (
                        <>
                          Pago único — <b>{deudaSeleccionada.pagado ? '100%' : `${deudaSeleccionada.porcentaje_pagado_cuotas || 0}%`}</b> pagado
                        </>
                      )}
                    </div>
                    <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
                      <input
                        name="monto"
                        type="number"
                        min="1"
                        placeholder="Monto"
                        value={
                          deudaSeleccionada.cuotas_totales > 1
                            ? Math.round((deudaSeleccionada.monto / deudaSeleccionada.cuotas_totales) || 0)
                            : pagoForm.monto
                        }
                        onChange={deudaSeleccionada.cuotas_totales > 1 ? undefined : handlePagoInput}
                        style={{width:110}}
                        readOnly={deudaSeleccionada.cuotas_totales > 1}
                      />
                      <input name="fecha_pago" type="date" value={pagoForm.fecha_pago} onChange={handlePagoInput} style={{width:130}} />
                      <div style={{fontSize:14, color:'#607d8b', minWidth:140, textAlign:'right'}}>
                        <b>Sobrante disponible:</b> {formatoMoneda(saldoAportes)}
                      </div>
                    </div>
                    <input name="comentario" placeholder="Comentario (opcional)" value={pagoForm.comentario} onChange={handlePagoInput} style={{width:'100%',margin:'8px 0'}} />
                    <button onClick={handleRegistrarPago} disabled={pagoLoading || (!pagoForm.fecha_pago || (deudaSeleccionada.cuotas_totales > 1 ? false : !pagoForm.monto) || Number(deudaSeleccionada.cuotas_totales > 1 ? Math.round((deudaSeleccionada.monto / deudaSeleccionada.cuotas_totales) || 0) : pagoForm.monto) <= 0)} style={{background:'#43a047',color:'#fff',border:'none',borderRadius:5,padding:'7px 18px',fontWeight:600,opacity:(!pagoForm.fecha_pago || (deudaSeleccionada.cuotas_totales > 1 ? false : !pagoForm.monto) || Number(deudaSeleccionada.cuotas_totales > 1 ? Math.round((deudaSeleccionada.monto / deudaSeleccionada.cuotas_totales) || 0) : pagoForm.monto) <= 0) ? 0.6 : 1,cursor:(!pagoForm.fecha_pago || (deudaSeleccionada.cuotas_totales > 1 ? false : !pagoForm.monto) || Number(deudaSeleccionada.cuotas_totales > 1 ? Math.round((deudaSeleccionada.monto / deudaSeleccionada.cuotas_totales) || 0) : pagoForm.monto) <= 0) ? 'not-allowed' : 'pointer'}}>
                      {pagoLoading ? 'Registrando...' : 'Registrar pago'}
                    </button>
                    {pagoError && <div style={{color:'#e53935',marginTop:6,fontSize:13}}>{pagoError}</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PresupuestoDashboard;
