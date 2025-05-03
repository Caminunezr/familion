import React, { useState, useMemo } from 'react';
import { agruparDatosHistorial } from '../../utils/historialUtils';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Iconos por categoría (puedes cambiar por SVGs si lo prefieres)
const categoriaIcono = {
  'Luz': '💡',
  'Agua': '💧',
  'Gas': '🔥',
  'Internet': '🌐',
  'Utiles de Aseo': '🧹',
  'Arriendo': '🏠',
  'Gasto Común': '🏢',
  'Otros': '📦',
};

// Definir colores por categoría
const categoriaColor = {
  'Luz': '#FFEB3B', // Amarillo
  'Agua': '#4FC3F7', // Celeste
  'Gas': '#FFB74D', // Naranja
  'Internet': '#1976D2', // Azul
  'Utiles de Aseo': '#AED581', // Verde claro
  'Arriendo': '#757575', // Gris oscuro
  'Gasto Común': '#BA68C8', // Violeta
  'Otros': '#BDBDBD', // Gris claro
};

const getCategoriaClass = (categoria) => {
  switch (categoria) {
    case 'Luz': return 'cat-luz';
    case 'Agua': return 'cat-agua';
    case 'Gas': return 'cat-gas';
    case 'Internet': return 'cat-internet';
    case 'Utiles de Aseo': return 'cat-aseo';
    case 'Otros': return 'cat-otros';
    case 'Arriendo': return 'cat-arriendo';
    case 'Gasto Común': return 'cat-gasto-comun';
    default: return '';
  }
};

const getEstadoCuenta = (cuenta) => {
  if (cuenta.estaPagada) {
    return { estado: 'Pagada', clase: 'pagada' };
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaVenc = cuenta.fecha_vencimiento ? new Date(cuenta.fecha_vencimiento) : null;
  if (fechaVenc && fechaVenc < hoy) {
    return { estado: 'Vencida', clase: 'vencida' };
  }
  return { estado: 'Pendiente', clase: 'pendiente' };
};

// Utilidad para mostrar el mes en formato largo
function formatoMesLargo(periodoKey) {
  if (!periodoKey) return '';
  const [anio, mes] = periodoKey.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(mes, 10) - 1]} ${anio}`;
}

// Adaptar las cuentas para que tengan fechaVencimiento (usada por agruparDatosHistorial)
function adaptarCuentasParaAgrupamiento(cuentas) {
  return cuentas.map(c => ({
    ...c,
    fechaVencimiento: c.fecha_vencimiento || c.fechaVencimiento
  }));
}

function getResumenMes(mes) {
  const totalCuentas = mes.cuentas.length;
  const totalPagado = mes.cuentas.reduce((sum, c) => sum + (parseFloat(c.totalPagado) || 0), 0);
  const totalMonto = mes.cuentas.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
  const totalPendiente = totalMonto - totalPagado;
  const hayVencidas = mes.cuentas.some(c => {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const fechaVenc = c.fecha_vencimiento ? new Date(c.fecha_vencimiento) : null;
    return !c.estaPagada && fechaVenc && fechaVenc < hoy;
  });
  const hayPendientes = mes.cuentas.some(c => !c.estaPagada && !hayVencidas);
  let icono = '✅';
  if (hayVencidas) icono = '⚠️';
  else if (hayPendientes) icono = '⏳';
  return { totalCuentas, totalPagado, totalPendiente, icono };
}

function agruparPorAnio(meses) {
  const agrupado = {};
  meses.forEach(mes => {
    const anio = mes.periodo.split('-')[0];
    if (!agrupado[anio]) agrupado[anio] = [];
    agrupado[anio].push(mes);
  });
  return agrupado;
}

function getResumenAnualPorCategoria(meses) {
  // Devuelve un objeto: { anio: [{categoria: monto, ...}, ...por cada mes] }
  const resumenPorAnio = {};
  meses.forEach(mes => {
    const [anio, mesNum] = mes.periodo.split('-');
    if (!resumenPorAnio[anio]) resumenPorAnio[anio] = Array(12).fill(null).map(() => ({}));
    const idx = parseInt(mesNum, 10) - 1;
    mes.cuentas.forEach(cuenta => {
      const cat = cuenta.categoria || 'Otros';
      const monto = parseFloat(cuenta.monto) || 0;
      if (!resumenPorAnio[anio][idx][cat]) resumenPorAnio[anio][idx][cat] = 0;
      resumenPorAnio[anio][idx][cat] += monto;
    });
  });
  return resumenPorAnio;
}

function ResumenAnual({ meses, anioActivo }) {
  const resumen = getResumenAnualPorCategoria(meses);
  const data = resumen[anioActivo] || [];
  const labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  // Obtener todas las categorías presentes en el año
  const categorias = Array.from(new Set(
    data.flatMap(m => Object.keys(m))
  ));
  // Colores por categoría (usar los definidos antes)
  const categoriaColor = {
    'Luz': '#FFEB3B',
    'Agua': '#4FC3F7',
    'Gas': '#FFB74D',
    'Internet': '#1976D2',
    'Utiles de Aseo': '#AED581',
    'Arriendo': '#757575',
    'Gasto Común': '#BA68C8',
    'Otros': '#BDBDBD',
  };
  const chartData = {
    labels,
    datasets: categorias.map(cat => ({
      label: cat,
      data: data.map(m => m[cat] || 0),
      backgroundColor: categoriaColor[cat] || '#BDBDBD',
      borderRadius: 6,
      maxBarThickness: 32
    }))
  };
  // Totales
  const totalCuentas = meses.filter(m=>m.periodo.startsWith(anioActivo)).reduce((sum, m) => sum + m.cuentas.length, 0);
  const totalMonto = meses.filter(m=>m.periodo.startsWith(anioActivo)).reduce((sum, m) => sum + m.cuentas.reduce((s, c) => s + (parseFloat(c.monto)||0), 0), 0);
  return (
    <div style={{background:'#fff',borderRadius:16,padding:'18px 10px 10px 10px',margin:'0 0 18px 0',boxShadow:'0 2px 8px rgba(25,118,210,0.07)',display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:18,justifyContent:'center',alignItems:'center',width:'100%'}}>
        <div style={{fontWeight:700,fontSize:18,color:'#1976d2'}}>Resumen {anioActivo}</div>
        <div style={{fontSize:15}}><strong>Total cuentas:</strong> {totalCuentas}</div>
        <div style={{fontSize:15,color:'#1976d2'}}><strong>Total monto:</strong> ${totalMonto.toLocaleString()}</div>
      </div>
      <div style={{width:'100%',maxWidth:600,minWidth:0}}>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: false }
            },
            scales: {
              x: { stacked: true, grid: {display:false} },
              y: { stacked: true, beginAtZero:true, grid: {color:'#eee'} }
            },
            maintainAspectRatio: false,
            aspectRatio: 2.5,
          }}
          height={220}
        />
      </div>
    </div>
  );
}

const TimelineSidebar = ({ aniosMeses, mesActivo, onSelectMes }) => {
  const currentYear = new Date().getFullYear().toString();
  const [expandedYears, setExpandedYears] = React.useState([currentYear]);

  const toggleYear = (anio) => {
    setExpandedYears((prev) =>
      prev.includes(anio)
        ? prev.filter((y) => y !== anio)
        : [...prev, anio]
    );
  };

  // Ordenar años: actual primero, luego descendente
  const orderedYears = Object.keys(aniosMeses).sort((a, b) => {
    if (a === currentYear) return -1;
    if (b === currentYear) return 1;
    return b.localeCompare(a);
  });

  return (
    <div style={{ minWidth: 210, borderRight: '2px solid #e0e0e0', padding: '18px 0', background: '#f7f9fb', height: '100%', overflowY: 'auto' }}>
      {orderedYears.map(anio => (
        <div key={anio} style={{marginBottom: 18}}>
          <div
            style={{fontWeight: 700, fontSize: 17, color: '#1976d2', margin: '0 0 8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8}}
            onClick={() => toggleYear(anio)}
          >
            <span>{anio}</span>
            <span style={{fontSize: 15, color: '#888'}}>{expandedYears.includes(anio) ? '▼' : '▶'}</span>
          </div>
          {expandedYears.includes(anio) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
              {aniosMeses[anio].map(mes => {
                const resumen = getResumenMes(mes);
                return (
                  <div
                    key={mes.periodo}
                    onClick={() => onSelectMes(mes.periodo)}
                    style={{
                      cursor: 'pointer',
                      padding: '10px 18px 10px 24px',
                      fontWeight: mes.periodo === mesActivo ? 700 : 400,
                      color: mes.periodo === mesActivo ? '#1976d2' : '#555',
                      background: mes.periodo === mesActivo ? '#e3f0fd' : 'transparent',
                      borderRight: mes.periodo === mesActivo ? '4px solid #1976d2' : '4px solid transparent',
                      borderRadius: '18px 0 0 18px',
                      marginBottom: 2,
                      position: 'relative',
                      transition: 'background 0.2s, color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{mes.etiqueta}</span>
                    <span style={{marginLeft: 8, fontSize: 18}}>{resumen.icono}</span>
                    <span style={{fontSize: 12, color: '#888', marginLeft: 8}}>
                      {resumen.totalCuentas} cuentas | ${resumen.totalPagado.toLocaleString()} pagado | ${resumen.totalPendiente.toLocaleString()} pendiente
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const TimelineCards = ({ cuentas, getEstadoCuenta, categoriaIcono, getCategoriaClass, onAbrirPanel, onEliminarCuenta, filtro, setFiltro, busqueda, setBusqueda, colorFondo }) => {
  // Filtrado por estado/categoría/búsqueda
  const cuentasFiltradas = useMemo(() => {
    return cuentas.filter(c => {
      if (filtro && filtro !== 'todas') {
        if (['pagada','pendiente','vencida'].includes(filtro)) {
          const estado = getEstadoCuenta(c).clase;
          if (estado !== filtro) return false;
        } else if (c.categoria !== filtro) {
          return false;
        }
      }
      if (busqueda && busqueda.trim() !== '') {
        const texto = `${c.descripcion || ''} ${c.proveedor_nombre || ''} ${c.categoria || ''}`.toLowerCase();
        if (!texto.includes(busqueda.toLowerCase())) return false;
      }
      return true;
    });
  }, [cuentas, filtro, busqueda]);

  return (
    <div style={{ position: 'relative', padding: '32px 0 32px 40px', background: colorFondo, borderRadius: 18, transition: 'background 0.4s' }}>
      <div style={{marginBottom: 18, display:'flex', gap:12, alignItems:'center'}}>
        <input type="text" placeholder="Buscar..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{padding:'6px 12px', borderRadius:6, border:'1px solid #ccc', fontSize:15}} />
        <select value={filtro} onChange={e=>setFiltro(e.target.value)} style={{padding:'6px 10px', borderRadius:6, border:'1px solid #ccc', fontSize:15}}>
          <option value="todas">Todas</option>
          <option value="pagada">Pagadas</option>
          <option value="pendiente">Pendientes</option>
          <option value="vencida">Vencidas</option>
          <option disabled>──────────</option>
          {[...new Set(cuentas.map(c=>c.categoria))].map(cat=>(<option key={cat} value={cat}>{cat}</option>))}
        </select>
      </div>
      {/* Línea vertical */}
      <div style={{ position: 'absolute', left: 12, top: 0, bottom: 0, width: 4, background: '#e0e0e0', borderRadius: 2 }} />
      {/* Grid de tarjetas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        alignItems: 'stretch',
        width: '100%',
        marginTop: 8
      }}>
        {cuentasFiltradas.map((cuenta, idx) => {
          const { estado, clase } = getEstadoCuenta(cuenta);
          const tituloPrincipal = cuenta.proveedor_nombre || cuenta.descripcion || cuenta.categoria || 'Cuenta';
          const proveedorDisplay = cuenta.proveedor_nombre || (cuenta.proveedor ? `ID: ${cuenta.proveedor}` : 'N/A');
          const icono = categoriaIcono[cuenta.categoria] || '📦';
          return (
            <div key={cuenta.id} style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', transition: 'background 0.3s' }}>
              {/* Nodo de la línea */}
              <div style={{ position: 'absolute', left: -28, top: 18, width: 24, height: 24, background: '#fff', border: `3px solid ${clase === 'pagada' ? '#43a047' : clase === 'vencida' ? '#e53935' : '#ffc107'}`, borderRadius: '50%', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#1976d2', fontWeight: 700 }}>{idx + 1}</div>
              {/* Tarjeta */}
              <div
                className={`cuenta-card-gc ${clase} ${getCategoriaClass(cuenta.categoria)}`}
                style={{
                  minWidth: 220,
                  maxWidth: 320,
                  background: '#fff',
                  borderLeft: `7px solid ${categoriaColor[cuenta.categoria] || '#BDBDBD'}`,
                  boxShadow: '0 1px 4px rgba(25,118,210,0.07)',
                  borderRadius: 10,
                  padding: 10,
                  marginLeft: 18,
                  marginBottom: 8,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'box-shadow 0.2s, background 0.2s',
                  fontSize: 14,
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                onClick={() => onAbrirPanel && onAbrirPanel(cuenta)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(25,118,210,0.13)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(25,118,210,0.07)'}
              >
                {/* Badge de estado en la esquina superior derecha */}
                <span className={`cuenta-estado-badge ${clase}`}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 8,
                    background: clase === 'pagada' ? '#e8f5e9' : clase === 'vencida' ? '#ffebee' : '#fffde7',
                    color: clase === 'pagada' ? '#388e3c' : clase === 'vencida' ? '#c62828' : '#f9a825',
                    fontWeight: 600,
                    zIndex: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >{estado}</span>
                {/* Contenido principal */}
                <div style={{display:'flex',alignItems:'center',gap:8, marginBottom:2}}>
                  <span style={{fontSize: '1.3rem'}}>{icono}</span>
                  <span style={{fontWeight:700, fontSize:13, color:'#1976d2', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{tituloPrincipal}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:6, marginBottom:2}}>
                  <span style={{fontWeight:600, color:'#1976d2'}}>{Number(cuenta.monto || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</span>
                  <span style={{fontSize:12, color:'#888'}}>Vence: {cuenta.fecha_vencimiento ? new Date(cuenta.fecha_vencimiento).toLocaleDateString('es-CL') : 'N/A'}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}>
                  <span style={{fontSize:12, color:'#555', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{cuenta.categoria}</span>
                  {proveedorDisplay !== tituloPrincipal && proveedorDisplay !== 'N/A' && (
                    <span style={{fontSize:12, color:'#888', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{proveedorDisplay}</span>
                  )}
                  {cuenta.factura && <span className="factura-indicator" title="Factura adjunta" style={{fontSize:15}}>📄</span>}
                </div>
                <div className="cuenta-card-actions" style={{ position:'absolute', bottom:8, right:8, display:'flex', gap:4, opacity:0.7 }}>
                  <span title="Ver / Editar" style={{cursor:'pointer',fontSize:16}} onClick={e => { e.stopPropagation(); onAbrirPanel(cuenta); }}>✏️</span>
                  {onEliminarCuenta && (
                    <span title="Eliminar" style={{cursor:'pointer',fontSize:16}} onClick={e => { e.stopPropagation(); onEliminarCuenta(cuenta.id); }}>🗑️</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {cuentasFiltradas.length === 0 && <div style={{color:'#888', fontSize:15, marginTop:18}}>No hay cuentas que coincidan con el filtro.</div>}
      </div>
    </div>
  );
};

const coloresFondo = ['#f7f9fb', '#f0f4f8'];

const GestionCuentasListado = ({
  loading,
  error,
  cuentas,
  searchTerm,
  onAbrirPanel,
  onAbrirFormularioNuevo,
  onEliminarCuenta,
}) => {
  // Adaptar y agrupar cuentas SIEMPRE antes de cualquier return
  const cuentasAdaptadas = adaptarCuentasParaAgrupamiento(cuentas);
  const agrupados = agruparDatosHistorial(cuentasAdaptadas, 'mes', formatoMesLargo);
  const meses = agrupados.porMes;
  const aniosMeses = useMemo(() => agruparPorAnio(meses), [meses]);
  const [mesActivo, setMesActivo] = useState(meses.length > 0 ? meses[0].periodo : null);
  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [fade, setFade] = useState(true);
  const handleSelectMes = (periodo) => {
    setFade(false);
    setTimeout(() => {
      setMesActivo(periodo);
      setFade(true);
    }, 180);
  };

  // Ahora los returns condicionales
  if (loading) {
    return <p>Cargando cuentas...</p>;
  }
  if (error && !cuentas.length) {
    return <p className="error-message">{error}</p>;
  }
  if (cuentas.length === 0 && !searchTerm) {
    return (
      <div className="empty-state-gc">
        <div className="empty-icon-gc">📋</div>
        <h3>No se encontraron cuentas</h3>
        <p>No tienes cuentas creadas. ¡Crea tu primera cuenta!</p>
        <button className="crear-cuenta-btn-empty" onClick={onAbrirFormularioNuevo}>
          + Crear Nueva Cuenta
        </button>
      </div>
    );
  }
  if (cuentas.length === 0 && searchTerm) {
    return <p>No se encontraron cuentas que coincidan con "{searchTerm}".</p>;
  }

  return (
    <div style={{ display: 'flex', minHeight: 400 }}>
      <TimelineSidebar aniosMeses={aniosMeses} mesActivo={mesActivo} onSelectMes={handleSelectMes} />
      <div style={{ flex: 1, overflowX: 'auto', transition: 'background 0.4s' }}>
        {meses.filter(m => m.periodo === mesActivo).map((mes, idx) => (
          <div key={mes.periodo} style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.4s' }}>
            <ResumenAnual meses={meses} anioActivo={mes.periodo.split('-')[0]} />
            <TimelineCards
              cuentas={mes.cuentas}
              getEstadoCuenta={getEstadoCuenta}
              categoriaIcono={categoriaIcono}
              getCategoriaClass={getCategoriaClass}
              onAbrirPanel={onAbrirPanel}
              onEliminarCuenta={onEliminarCuenta}
              filtro={filtro}
              setFiltro={setFiltro}
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              colorFondo={coloresFondo[idx % coloresFondo.length]}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestionCuentasListado;
