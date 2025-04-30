import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NavBar from '../NavBar';
import HistorialResumen from './HistorialResumen';
import HistorialGraficos from './HistorialGraficos';
import HistorialFiltros from './HistorialFiltros';
import HistorialPeriodos from './HistorialPeriodos';
import HistorialInterpretacion from './HistorialInterpretacion';
import { procesarCuentasYPagosHistorial, filtrarCuentasHistorial, agruparDatosHistorial } from '../../utils/historialUtils';
import styles from './Historial.module.css';

const obtenerMesEtiqueta = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
};

// Función para mostrar el nombre completo del mes
const obtenerMesNombreCompleto = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
};

function Historial() {
  const { familyId } = useAuth();
  const [cuentas, setCuentas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [filtros, setFiltros] = useState({
    filtroFechaInicio: '',
    filtroFechaFin: '',
    filtroCategoria: 'todas',
    filtroEstado: 'todos',
  });
  const [agrupacion, setAgrupacion] = useState('mes');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Procesar y filtrar datos (debe ir antes de cualquier useEffect que dependa de agrupados)
  const cuentasProcesadas = useMemo(() => procesarCuentasYPagosHistorial(cuentas, pagos), [cuentas, pagos]);
  const cuentasFiltradas = useMemo(() => filtrarCuentasHistorial(cuentasProcesadas, filtros), [cuentasProcesadas, filtros]);
  const agrupados = useMemo(() => agruparDatosHistorial(cuentasFiltradas, agrupacion, obtenerMesEtiqueta), [cuentasFiltradas, agrupacion]);

  // Estado para controlar qué meses están abiertos (acordeón)
  const [mesesAbiertos, setMesesAbiertos] = useState({});

  // Función para alternar el despliegue de un mes (acordeón)
  const toggleMes = (periodo) => {
    setMesesAbiertos(prev => ({ ...prev, [periodo]: !prev[periodo] }));
  };

  // Abrir el primer mes automáticamente cuando agrupados.porMes cambie
  useEffect(() => {
    if (agrupados.porMes && agrupados.porMes.length > 0) {
      setMesesAbiertos(prev => {
        if (Object.keys(prev).length > 0) return prev;
        return { [agrupados.porMes[0].periodo]: true };
      });
    }
  }, [agrupados.porMes]);

  // TODO: Reemplazar la lógica de carga de datos por fetch a la API Django

  // Calcular meses disponibles y sincronizar selector
  useEffect(() => {
    const meses = Array.from(new Set(cuentasProcesadas.map(c => c.fechaVencimiento?.slice(0, 7))))
      .filter(Boolean)
      .sort()
      .reverse();
    setMesesDisponibles(meses);
    if ((!mesSeleccionado && meses.length > 0) || (mesSeleccionado && !meses.includes(mesSeleccionado))) {
      setMesSeleccionado(meses[0] || '');
    }
  }, [cuentasProcesadas, mesSeleccionado]);

  // Resumen del mes seleccionado
  const resumen = useMemo(() => {
    const mes = agrupados.porMes?.find(m => m.periodo === mesSeleccionado);
    if (!mes) return { totalCuentas: 0, totalMonto: 0, totalPagado: 0, porcentajePagado: 0 };
    return {
      totalCuentas: mes.totalCuentas,
      totalMonto: mes.totalMonto,
      totalPagado: mes.montoPagado,
      porcentajePagado: mes.porcentajePagado
    };
  }, [agrupados, mesSeleccionado]);

  // Datos para gráficos
  const graficos = useMemo(() => {
    const mes = agrupados.porMes?.find(m => m.periodo === mesSeleccionado);
    const categorias = mes?.cuentas.reduce((acc, c) => {
      acc[c.categoria] = (acc[c.categoria] || 0) + (parseFloat(c.totalPagado) || 0);
      return acc;
    }, {}) || {};
    const catLabels = Object.keys(categorias);
    const catData = Object.values(categorias);
    const catColors = ['#1976d2','#43a047','#fbc02d','#e64a19','#8e24aa','#00bcd4','#ff7043','#689f38','#f06292','#7e57c2'];
    const labelsMes = agrupados.porMes?.map(m => m.etiqueta || m.periodo).reverse() || [];
    const dataMes = agrupados.porMes?.map(m => m.montoPagado).reverse() || [];
    return {
      categorias: {
        labels: catLabels,
        datasets: [{ data: catData, backgroundColor: catLabels.map((_,i)=>catColors[i%catColors.length]) }]
      },
      pagosVsVencimientos: {
        labels: labelsMes,
        datasets: [{ label: 'Total Pagado', data: dataMes, backgroundColor: '#1976d2' }]
      }
    };
  }, [agrupados, mesSeleccionado]);

  // Interpretación automática
  const interpretacion = useMemo(() => {
    if (!resumen.totalMonto) return { mensajePrincipal: 'No hay datos suficientes para generar una interpretación.', consejos: [], totalMonto: 0, totalPagado: 0 };
    let mensajePrincipal = '';
    let consejos = [];
    if (resumen.porcentajePagado >= 90) {
      mensajePrincipal = '¡Excelente! Has pagado casi todas tus cuentas este mes.';
      consejos = ['Sigue así y mantén tu buen hábito financiero.', 'Considera ahorrar el excedente.'];
    } else if (resumen.porcentajePagado >= 60) {
      mensajePrincipal = 'Vas bien, pero aún puedes mejorar el pago de tus cuentas.';
      consejos = ['Revisa las cuentas pendientes y prioriza las más urgentes.', 'Evita recargos por pagos atrasados.'];
    } else {
      mensajePrincipal = 'Atención: tienes muchas cuentas sin pagar este mes.';
      consejos = ['Organiza tus pagos para evitar deudas.', 'Considera automatizar algunos pagos.', 'Revisa tu presupuesto mensual.'];
    }
    return {
      mensajePrincipal,
      consejos,
      totalMonto: resumen.totalMonto,
      totalPagado: resumen.totalPagado
    };
  }, [resumen]);

  // Comparativa por periodos
  const comparativa = useMemo(() => ({ porPeriodo: agrupados.porMes?.map(m => ({
    nombrePeriodo: m.etiqueta || m.periodo,
    montoTotal: m.totalMonto,
    totalPagado: m.montoPagado,
    porcentajePagado: m.porcentajePagado
  })) || [] }), [agrupados]);

  // Renderizado
  return (
    <div className={styles['historial-page']}>
      <NavBar />
      <div className={styles['historial-main']}>
        <h2 className={styles['historial-titulo']}>Historial Financiero Familiar</h2>

        {/* Grid principal: Filtros a la izquierda, Paneles a la derecha */}
        <div className={styles['historial-content-grid']}>
          {/* Columna de Filtros */}
          <div className={`${styles['historial-filtros-bar']} ${styles.card}`}>
            <HistorialFiltros
              filtros={filtros}
              categorias={[]} // Puedes pasar categorías únicas si las tienes
              agrupacion={agrupacion}
              onFilterChange={(name, value) => setFiltros(f => ({ ...f, [name]: value }))}
              onAgrupacionChange={setAgrupacion}
              onExport={() => { /* Lógica de exportación */ }}
            />
            {/* Selector de Mes (puede ir dentro o fuera de HistorialFiltros) */}
            <div className={styles['historial-mes-selector']}>
              <label>Mes:</label>
              <select value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)}>
                {mesesDisponibles.map(mes => (
                  <option key={mes} value={mes}>{obtenerMesNombreCompleto(mes)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Columna de Paneles Principales */}
          <div className={styles['historial-paneles']}>
            <div className={styles.card}>
              <HistorialResumen resumen={resumen} />
            </div>
            <div className={styles.card}>
              <HistorialGraficos graficos={graficos} />
            </div>
            <div className={styles.card}>
              <HistorialInterpretacion interpretacion={interpretacion} />
            </div>
          </div>
        </div>

        {/* Sección de Comparativa por Periodos (debajo del grid principal) */}
        <div className={styles['historial-periodos-section']}>
          <div className={styles.card}>
            <HistorialPeriodos comparativa={comparativa} />
          </div>
        </div>

        {/* Sección de Listado por Mes (Acordeón) */}
        <div className={styles['historial-listado-section']}>
          {agrupacion === 'mes' && agrupados.porMes && agrupados.porMes.map((mes) => (
            <div key={mes.periodo} className={`${styles['historial-mes-card']} ${styles.card} ${styles['mb-4']}`}>
              <div
                className={styles['historial-mes-header']}
                onClick={() => toggleMes(mes.periodo)}
              >
                <span>{obtenerMesNombreCompleto(mes.periodo)}</span>
                <span style={{ fontSize: '1.2em', transition: 'transform 0.2s', transform: mesesAbiertos[mes.periodo] ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
              </div>
              {mesesAbiertos[mes.periodo] && (
                <div className={styles['historial-mes-body']}>
                  {mes.cuentas.map(cuenta => (
                    <div key={cuenta.id} className={`${styles['historial-cuenta-item']} ${cuenta.estaPagada ? styles.pagada : styles.pendiente}`}>
                      <div>
                        <b>{cuenta.nombre || cuenta.id}</b> <span className={`${styles.badge} ${styles['bg-secondary']} ${styles['ms-2']}`}>{cuenta.categoria}</span>
                        <div className={`${styles['text-muted']} ${styles.small}`}>Vencimiento: {cuenta.fechaVencimiento ? new Date(cuenta.fechaVencimiento).toLocaleDateString() : '-'}</div>
                      </div>
                      <div className={styles['text-end']}>
                        <div className={cuenta.estaPagada ? styles['text-success'] : styles['text-danger']} style={{fontWeight:600}}>
                          {cuenta.estaPagada ? 'Pagada' : 'Pendiente'}
                        </div>
                        <div>Monto: <b>${Number(cuenta.monto).toLocaleString()}</b></div>
                        <div>Pagado: <b>${Number(cuenta.totalPagado).toLocaleString()}</b></div>
                      </div>
                    </div>
                  ))}
                  {mes.cuentas.length === 0 && <p className={styles['empty-state']}>No hay cuentas para este mes.</p>}
                </div>
              )}
            </div>
          ))}
          {agrupacion === 'mes' && (!agrupados.porMes || agrupados.porMes.length === 0) && !loading && (
            <p className={styles['empty-state']}>No hay datos mensuales para mostrar con los filtros actuales.</p>
          )}
        </div>

        {/* Indicador de Carga */}
        {loading && <div className={styles['historial-loading']}>Cargando historial...</div>}
      </div>
    </div>
  );
}

export default Historial;
