import React, { useState, useMemo } from 'react';
import { agruparDatosHistorial } from '../../utils/historialUtils';
import { Bar } from 'react-chartjs-2';
import './TimelineSidebar.css';
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

  // Detectar si estamos en modo nocturno
  const isDarkMode = document.querySelector('[data-theme="dark"]');
  
  // Configuración adaptable para modo nocturno
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          color: isDarkMode ? '#e0e0e0' : '#333',
          font: {
            family: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif',
            size: 12
          }
        }
      },
      title: { display: false },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(66, 66, 66, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: isDarkMode ? '#ffffff' : '#ffffff',
        bodyColor: isDarkMode ? '#e0e0e0' : '#ffffff',
        borderColor: isDarkMode ? '#555' : '#ddd',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: { 
        stacked: true, 
        grid: { display: false },
        ticks: {
          color: isDarkMode ? '#b0b0b0' : '#666',
          font: { size: 11 }
        }
      },
      y: { 
        stacked: true, 
        beginAtZero: true, 
        grid: { 
          color: isDarkMode ? '#404040' : '#eee',
          lineWidth: 1
        },
        ticks: {
          color: isDarkMode ? '#b0b0b0' : '#666',
          font: { size: 11 },
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    },
    maintainAspectRatio: false,
    aspectRatio: 2.5,
    animation: {
      duration: 750,
      easing: 'easeOutQuart'
    }
  };

  const chartData = {
    labels,
    datasets: categorias.map(cat => ({
      label: cat,
      data: data.map(m => m[cat] || 0),
      backgroundColor: categoriaColor[cat] || '#BDBDBD',
      borderRadius: 6,
      maxBarThickness: 32,
      // Añadir una sombra sutil en modo nocturno
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      borderWidth: isDarkMode ? 1 : 0
    }))
  };
  
  // Totales
  const totalCuentas = meses.filter(m=>m.periodo.startsWith(anioActivo)).reduce((sum, m) => sum + m.cuentas.length, 0);
  const totalMonto = meses.filter(m=>m.periodo.startsWith(anioActivo)).reduce((sum, m) => sum + m.cuentas.reduce((s, c) => s + (parseFloat(c.monto)||0), 0), 0);
  
  return (
    <div style={{
      background: isDarkMode ? 'var(--theme-bg-card)' : '#fff',
      borderRadius: 16,
      padding: '18px 10px 10px 10px',
      margin: '0 0 18px 0',
      boxShadow: isDarkMode 
        ? '0 4px 20px rgba(100, 181, 246, 0.15)' 
        : '0 2px 8px rgba(25,118,210,0.07)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      border: isDarkMode ? '1px solid var(--theme-border-color)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      <div style={{display:'flex',flexWrap:'wrap',gap:18,justifyContent:'center',alignItems:'center',width:'100%'}}>
        <div style={{
          fontWeight: 700,
          fontSize: 18,
          color: isDarkMode ? 'var(--theme-accent-primary)' : '#1976d2'
        }}>
          Resumen {anioActivo}
        </div>
        <div style={{
          fontSize: 15,
          color: isDarkMode ? 'var(--theme-text-secondary)' : '#333'
        }}>
          <strong>Total cuentas:</strong> {totalCuentas}
        </div>
        <div style={{
          fontSize: 15,
          color: isDarkMode ? 'var(--theme-accent-primary)' : '#1976d2'
        }}>
          <strong>Total monto:</strong> ${totalMonto.toLocaleString()}
        </div>
      </div>
      <div style={{width:'100%',maxWidth:600,minWidth:0}}>
        <Bar
          data={chartData}
          options={chartOptions}
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
    <div className="timeline-sidebar">
      {orderedYears.map(anio => (
        <div key={anio} className="year-group">
          <div
            className="year-header"
            onClick={() => toggleYear(anio)}
          >
            <span>{anio}</span>
            <span className={`year-toggle-icon ${expandedYears.includes(anio) ? 'expanded' : ''}`}>
              ▶
            </span>
          </div>
          {expandedYears.includes(anio) && (
            <div className="months-container">
              {aniosMeses[anio].map(mes => {
                const resumen = getResumenMes(mes);
                const isActive = mes.periodo === mesActivo;
                
                // Determinar estado visual
                let statusClass = '';
                if (resumen.porcentajePagado >= 80) statusClass = 'status-success';
                else if (resumen.porcentajePagado > 0) statusClass = 'status-warning';
                else statusClass = 'status-danger';
                
                return (
                  <div
                    key={mes.periodo}
                    onClick={() => onSelectMes(mes.periodo)}
                    className={`month-item ${isActive ? 'active' : ''} ${statusClass}`}
                  >
                    <div className="month-content">
                      <div className="month-name">{mes.etiqueta}</div>
                      <div className="month-summary">
                        {resumen.totalCuentas} cuentas | ${resumen.totalPagado.toLocaleString()} pagado
                        {resumen.totalPendiente !== 0 && (
                          <> | ${Math.abs(resumen.totalPendiente).toLocaleString()} pendiente</>
                        )}
                      </div>
                    </div>
                    <span className="month-status-icon">{resumen.icono}</span>
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

const TimelineCards = ({ cuentas, getEstadoCuenta, categoriaIcono, getCategoriaClass, onAbrirPanel, onEliminarCuenta, onAbrirPagoDesdeTarjeta, filtro, setFiltro, busqueda, setBusqueda, colorFondo }) => {
  // Detectar modo nocturno
  const isDarkMode = document.querySelector('[data-theme="dark"]');
  
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
  }, [cuentas, filtro, busqueda, getEstadoCuenta]);

  return (
    <div style={{ 
      position: 'relative', 
      padding: '32px 0 32px 40px', 
      background: isDarkMode ? 'var(--theme-bg-secondary)' : colorFondo, 
      borderRadius: 18, 
      transition: 'background 0.4s',
      border: isDarkMode ? '1px solid var(--theme-border-color)' : 'none'
    }}>
      <div style={{marginBottom: 18, display:'flex', gap:12, alignItems:'center'}}>
        <input 
          type="text" 
          placeholder="Buscar..." 
          value={busqueda} 
          onChange={e=>setBusqueda(e.target.value)} 
          style={{
            padding:'6px 12px', 
            borderRadius:6, 
            border: isDarkMode ? '1px solid var(--theme-border-color)' : '1px solid #ccc', 
            fontSize:15,
            background: isDarkMode ? 'var(--theme-bg-tertiary)' : '#fff',
            color: isDarkMode ? 'var(--theme-text-primary)' : '#333',
            transition: 'all 0.3s ease'
          }} 
        />
        <select 
          value={filtro} 
          onChange={e=>setFiltro(e.target.value)} 
          style={{
            padding:'6px 10px', 
            borderRadius:6, 
            border: isDarkMode ? '1px solid var(--theme-border-color)' : '1px solid #ccc', 
            fontSize:15,
            background: isDarkMode ? 'var(--theme-bg-tertiary)' : '#fff',
            color: isDarkMode ? 'var(--theme-text-primary)' : '#333',
            transition: 'all 0.3s ease'
          }}
        >
          <option value="todas">Todas</option>
          <option value="pagada">Pagadas</option>
          <option value="pendiente">Pendientes</option>
          <option value="vencida">Vencidas</option>
          <option disabled>──────────</option>
          {[...new Set(cuentas.map(c=>c.categoria))].map(cat=>(<option key={cat} value={cat}>{cat}</option>))}
        </select>
      </div>
      {/* Línea vertical */}
      <div style={{ 
        position: 'absolute', 
        left: 12, 
        top: 0, 
        bottom: 0, 
        width: 4, 
        background: isDarkMode ? 'var(--theme-border-color)' : '#e0e0e0', 
        borderRadius: 2,
        transition: 'background 0.3s ease'
      }} />
      {/* Grid de tarjetas rediseñado */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        alignItems: 'stretch',
        width: '100%',
        marginTop: 20,
        padding: '0 4px'
      }}>
        {cuentasFiltradas.map((cuenta, idx) => {
          const { estado, clase } = getEstadoCuenta(cuenta);
          const tituloPrincipal = cuenta.proveedor_nombre || cuenta.descripcion || cuenta.categoria || 'Cuenta';
          const proveedorDisplay = cuenta.proveedor_nombre || (cuenta.proveedor ? `ID: ${cuenta.proveedor}` : 'N/A');
          const icono = categoriaIcono[cuenta.categoria] || '📦';
          const categoriaColorValue = categoriaColor[cuenta.categoria] || '#BDBDBD';
          
          return (
            <div key={cuenta.id} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              position: 'relative',
              marginBottom: 12
            }}>
              {/* Nodo de timeline optimizado */}
              <div style={{ 
                position: 'absolute', 
                left: -30, 
                top: 22, 
                width: 24, 
                height: 24, 
                background: isDarkMode ? 'var(--theme-bg-card)' : '#fff', 
                border: `3px solid ${clase === 'pagada' ? '#4caf50' : clase === 'vencida' ? '#f44336' : '#ff9800'}`, 
                borderRadius: '50%', 
                zIndex: 3, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 10, 
                color: isDarkMode ? 'var(--theme-text-primary)' : '#333', 
                fontWeight: 700,
                boxShadow: isDarkMode ? '0 2px 6px rgba(100, 181, 246, 0.25)' : '0 2px 6px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease'
              }}>
                {idx + 1}
              </div>
              
              {/* Tarjeta completamente rediseñada */}
              <div
                className={`cuenta-card-gc ${clase} ${getCategoriaClass(cuenta.categoria)}`}
                style={{
                  width: '100%',
                  minHeight: 160,
                  background: isDarkMode ? 'var(--theme-bg-card)' : '#ffffff',
                  borderRadius: 12,
                  marginLeft: 16,
                  position: 'relative',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isDarkMode ? '0 4px 20px rgba(100, 181, 246, 0.1)' : '0 2px 10px rgba(0,0,0,0.06)',
                  border: isDarkMode ? '1px solid var(--theme-border-color)' : '1px solid #f0f0f0'
                }}
                onClick={() => onAbrirPanel && onAbrirPanel(cuenta)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 8px 32px rgba(100, 181, 246, 0.2)' 
                    : '0 6px 25px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 4px 20px rgba(100, 181, 246, 0.1)' 
                    : '0 2px 10px rgba(0,0,0,0.06)';
                }}
              >
                {/* Header simplificado */}
                <div style={{
                  background: isDarkMode 
                    ? `linear-gradient(90deg, ${categoriaColorValue}20, ${categoriaColorValue}08)` 
                    : `linear-gradient(90deg, ${categoriaColorValue}12, ${categoriaColorValue}05)`,
                  padding: '14px 16px',
                  borderBottom: isDarkMode ? '1px solid var(--theme-border-color)' : '1px solid #f5f5f5',
                  position: 'relative'
                }}>
                  {/* Badge de estado minimalista */}
                  <span style={{
                    position: 'absolute',
                    top: 10,
                    right: 12,
                    fontSize: 9,
                    padding: '3px 8px',
                    borderRadius: 10,
                    background: isDarkMode
                      ? (clase === 'pagada' ? 'rgba(76, 175, 80, 0.25)' : clase === 'vencida' ? 'rgba(244, 67, 54, 0.25)' : 'rgba(255, 152, 0, 0.25)')
                      : (clase === 'pagada' ? '#e8f5e9' : clase === 'vencida' ? '#ffebee' : '#fff8e1'),
                    color: clase === 'pagada' ? '#4caf50' : clase === 'vencida' ? '#f44336' : '#ff9800',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    border: isDarkMode ? `1px solid ${clase === 'pagada' ? '#4caf50' : clase === 'vencida' ? '#f44336' : '#ff9800'}40` : 'none'
                  }}>
                    {estado}
                  </span>
                  
                  {/* Título e ícono */}
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, paddingRight: 60}}>
                    <span style={{
                      fontSize: '1.4rem',
                      padding: '4px',
                      background: isDarkMode ? `${categoriaColorValue}25` : `${categoriaColorValue}15`,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 32,
                      height: 32,
                      border: isDarkMode ? `1px solid ${categoriaColorValue}40` : 'none'
                    }}>{icono}</span>
                    <div style={{flex: 1, minWidth: 0}}>
                      <h4 style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: isDarkMode ? 'var(--theme-text-primary)' : '#1a1a1a',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {tituloPrincipal}
                      </h4>
                      <span style={{
                        fontSize: 11,
                        color: isDarkMode ? 'var(--theme-text-secondary)' : '#666',
                        fontWeight: 500
                      }}>
                        {cuenta.categoria}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenido principal reorganizado */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Monto prominente */}
                  <div style={{
                    textAlign: 'center',
                    padding: '10px 0',
                    background: isDarkMode ? 'var(--theme-bg-tertiary)' : '#fafbfc',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid var(--theme-border-color)' : '1px solid #e8eaed'
                  }}>
                    <div style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: isDarkMode ? 'var(--theme-accent-primary)' : '#1976d2',
                      lineHeight: 1
                    }}>
                      {Number(cuenta.monto || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                    </div>
                  </div>

                  {/* Información en filas compactas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <span style={{fontSize: 11, color: isDarkMode ? 'var(--theme-text-muted)' : '#888', minWidth: 16}}>📅</span>
                      <span style={{fontSize: 12, color: isDarkMode ? 'var(--theme-text-secondary)' : '#555'}}>
                        Vence: {cuenta.fecha_vencimiento ? new Date(cuenta.fecha_vencimiento).toLocaleDateString('es-CL') : 'Sin fecha'}
                      </span>
                    </div>
                    
                    {proveedorDisplay !== tituloPrincipal && proveedorDisplay !== 'N/A' && (
                      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <span style={{fontSize: 11, color: isDarkMode ? 'var(--theme-text-muted)' : '#888', minWidth: 16}}>🏢</span>
                        <span style={{fontSize: 12, color: isDarkMode ? 'var(--theme-text-secondary)' : '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                          {proveedorDisplay}
                        </span>
                      </div>
                    )}
                    
                    {cuenta.factura && (
                      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <span style={{fontSize: 11, color: isDarkMode ? 'var(--theme-text-muted)' : '#888', minWidth: 16}}>📄</span>
                        <span style={{fontSize: 12, color: '#4caf50', fontWeight: 500}}>Factura adjunta</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer con acciones */}
                <div style={{ 
                  padding: '10px 16px', 
                  borderTop: isDarkMode ? '1px solid var(--theme-border-color)' : '1px solid #f5f5f5',
                  background: isDarkMode ? 'var(--theme-bg-tertiary)' : '#fafbfc',
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: 6
                }}>
                  {onAbrirPagoDesdeTarjeta && (
                    <button 
                      style={{
                        background: '#43a047',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: isDarkMode ? '0 2px 8px rgba(67, 160, 71, 0.3)' : 'none'
                      }}
                      onClick={e => { e.stopPropagation(); onAbrirPagoDesdeTarjeta(cuenta); }}
                      onMouseEnter={e => e.target.style.background = '#388e3c'}
                      onMouseLeave={e => e.target.style.background = '#43a047'}
                    >
                      Registrar pago
                    </button>
                  )}
                  <button 
                    style={{
                      background: isDarkMode ? 'var(--theme-accent-primary)' : '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(100, 181, 246, 0.3)' : 'none'
                    }}
                    onClick={e => { e.stopPropagation(); onAbrirPanel(cuenta); }}
                    onMouseEnter={e => e.target.style.background = isDarkMode ? '#42a5f5' : '#1565c0'}
                    onMouseLeave={e => e.target.style.background = isDarkMode ? 'var(--theme-accent-primary)' : '#1976d2'}
                  >
                    Editar
                  </button>
                  {onEliminarCuenta && (
                    <button 
                      style={{
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: isDarkMode ? '0 2px 8px rgba(244, 67, 54, 0.3)' : 'none'
                      }}
                      onClick={e => { e.stopPropagation(); onEliminarCuenta(cuenta.id); }}
                      onMouseEnter={e => e.target.style.background = '#d32f2f'}
                      onMouseLeave={e => e.target.style.background = '#f44336'}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {cuentasFiltradas.length === 0 && (
          <div style={{
            color: isDarkMode ? 'var(--theme-text-muted)' : '#888', 
            fontSize: 15, 
            marginTop: 18,
            textAlign: 'center',
            padding: '20px',
            background: isDarkMode ? 'var(--theme-bg-tertiary)' : '#f9f9f9',
            borderRadius: 8,
            border: isDarkMode ? '1px solid var(--theme-border-color)' : '1px solid #eee'
          }}>
            No hay cuentas que coincidan con el filtro.
          </div>
        )}
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
  onAbrirPagoDesdeTarjeta,
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
              onAbrirPagoDesdeTarjeta={onAbrirPagoDesdeTarjeta}
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
