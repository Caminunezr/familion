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
      await createDeuda({ ...form, presupuesto: presupuesto.id });
      setShowDeuda(false); setForm(initialForm); setAccionSuccess('Deuda registrada');
      await recargarDatos();
    } catch (e) { setAccionError('Error al registrar deuda'); }
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
                  <li key={d.id}>
                    <b>{formatoMoneda(d.monto)}</b> {d.pagado ? <span style={{color:'#43a047'}}>(Pagada)</span> : <span style={{color:'#e53935'}}>(Pendiente)</span>}
                    {d.comentario && <span style={{color:'#888'}}> — {d.comentario}</span>}
                    <button style={{marginLeft:8, color:'#fff', background:'#ff9800', border:'none', borderRadius:4, padding:'2px 8px', fontSize:'0.95em', cursor:'pointer'}}
                      onClick={() => handleEliminarDeuda(d.id)} disabled={accionLoading}>
                      Eliminar
                    </button>
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
            <div className="presupuesto-modal responsive-modal">
              <button className="presupuesto-modal-close" onClick={()=>setShowDeuda(false)}>×</button>
              <h3>Registrar Deuda</h3>
              <input name="monto" type="number" placeholder="Monto" value={form.monto} onChange={handleInputChange} style={{width:'100%',marginBottom:12}} />
              <input name="comentario" placeholder="Comentario" value={form.comentario} onChange={handleInputChange} style={{width:'100%',marginBottom:12}} />
              <button onClick={handleDeuda} disabled={accionLoading} style={{width:'100%',background:'#ff9800',color:'#fff',padding:10,border:'none',borderRadius:6}}>
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
        </div>
      </div>
    </>
  );
};

export default PresupuestoDashboard;
