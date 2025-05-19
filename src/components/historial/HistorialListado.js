// src/components/historial/HistorialListado.js
import React, { useState } from 'react';
import styles from './Historial.module.css';

const obtenerMesNombreCompleto = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
};

const HistorialListado = ({ 
  datosAgrupados, 
  agrupacion, 
  viewMode, 
  onVerDetalles,
  loading 
}) => {
  const [mesesAbiertos, setMesesAbiertos] = useState({});
  const [ordenarPor, setOrdenarPor] = useState('fechaVencimiento');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  
  // Alternar apertura de un mes (accordion)
  const toggleMes = (periodo) => {
    setMesesAbiertos(prev => ({ ...prev, [periodo]: !prev[periodo] }));
  };
  
  // Cambiar ordenamiento
  const cambiarOrden = (campo) => {
    if (campo === ordenarPor) {
      setOrdenAscendente(!ordenAscendente);
    } else {
      setOrdenarPor(campo);
      setOrdenAscendente(true);
    }
  };
  
  // Renderizar como tabla
  if (viewMode === 'table') {
    return (
      <div className={styles['historial-tabla']}>
        <h3 className={styles['tabla-titulo']}>Listado de Cuentas</h3>
        <table className={styles['historial-table']}>
          <thead>
            <tr>
              <th onClick={() => cambiarOrden('nombre')}>
                Nombre {ordenarPor === 'nombre' && (ordenAscendente ? '▲' : '▼')}
              </th>
              <th onClick={() => cambiarOrden('categoria')}>
                Categoría {ordenarPor === 'categoria' && (ordenAscendente ? '▲' : '▼')}
              </th>
              <th onClick={() => cambiarOrden('fechaVencimiento')}>
                Vencimiento {ordenarPor === 'fechaVencimiento' && (ordenAscendente ? '▲' : '▼')}
              </th>
              <th onClick={() => cambiarOrden('monto')}>
                Monto {ordenarPor === 'monto' && (ordenAscendente ? '▲' : '▼')}
              </th>
              <th onClick={() => cambiarOrden('totalPagado')}>
                Pagado {ordenarPor === 'totalPagado' && (ordenAscendente ? '▲' : '▼')}
              </th>
              <th onClick={() => cambiarOrden('estaPagada')}>
                Estado {ordenarPor === 'estaPagada' && (ordenAscendente ? '▲' : '▼')}
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datosAgrupados.porMes?.flatMap(mes => 
              mes.cuentas
                .sort((a, b) => {
                  let valorA = a[ordenarPor];
                  let valorB = b[ordenarPor];
                  
                  if (typeof valorA === 'string') valorA = valorA.toLowerCase();
                  if (typeof valorB === 'string') valorB = valorB.toLowerCase();
                  
                  if (ordenAscendente) {
                    return valorA > valorB ? 1 : -1;
                  } else {
                    return valorA < valorB ? 1 : -1;
                  }
                })
                .map(cuenta => (
                  <tr 
                    key={cuenta.id} 
                    className={cuenta.estaPagada ? styles['fila-pagada'] : styles['fila-pendiente']}
                  >
                    <td>{cuenta.nombre || cuenta.id}</td>
                    <td>{cuenta.categoria}</td>
                    <td>{new Date(cuenta.fechaVencimiento).toLocaleDateString()}</td>
                    <td>${Number(cuenta.monto).toLocaleString()}</td>
                    <td>${Number(cuenta.totalPagado).toLocaleString()}</td>
                    <td className={cuenta.estaPagada ? styles['text-success'] : styles['text-danger']}>
                      {cuenta.estaPagada ? 'Pagada' : 'Pendiente'}
                    </td>
                    <td>
                      <button 
                        className={styles['btn-detalles']}
                        onClick={() => onVerDetalles(cuenta)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
            )}
            {(!datosAgrupados.porMes || datosAgrupados.porMes.length === 0) && !loading && (
              <tr>
                <td colSpan="7" className={styles['empty-state']}>
                  No hay datos para mostrar con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
  
  // Renderizar como acordeón (vista por defecto)
  return (
    <div className={styles['historial-listado']}>
      <h3 className={styles['listado-titulo']}>Cuentas por Mes</h3>
      
      {agrupacion === 'mes' && datosAgrupados.porMes?.map((mes) => (
        <div key={mes.periodo} className={styles['mes-card']}>
          <div
            className={styles['mes-header']}
            onClick={() => toggleMes(mes.periodo)}
          >
            <div className={styles['mes-info']}>
              <span className={styles['mes-nombre']}>{obtenerMesNombreCompleto(mes.periodo)}</span>
              <span className={styles['mes-estadisticas']}>
                {mes.totalCuentas} cuentas · ${mes.totalMonto.toLocaleString()} · 
                <span className={mes.porcentajePagado > 75 ? styles['text-success'] : styles['text-warning']}>
                  {mes.porcentajePagado}% pagado
                </span>
              </span>
            </div>
            <span className={styles['mes-toggle']}>
              {mesesAbiertos[mes.periodo] ? '▼' : '▶'}
            </span>
          </div>
          
          {mesesAbiertos[mes.periodo] && (
            <div className={styles['mes-cuentas']}>
              {mes.cuentas
                .sort((a, b) => {
                  let valorA = a[ordenarPor];
                  let valorB = b[ordenarPor];
                  
                  if (typeof valorA === 'string') valorA = valorA.toLowerCase();
                  if (typeof valorB === 'string') valorB = valorB.toLowerCase();
                  
                  if (ordenAscendente) {
                    return valorA > valorB ? 1 : -1;
                  } else {
                    return valorA < valorB ? 1 : -1;
                  }
                })
                .map(cuenta => (
                  <div 
                    key={cuenta.id} 
                    className={`${styles['cuenta-item']} ${cuenta.estaPagada ? styles.pagada : styles.pendiente}`}
                    onClick={() => onVerDetalles(cuenta)}
                  >
                    <div className={styles['cuenta-info']}>
                      <div className={styles['cuenta-principal']}>
                        <h4>{cuenta.nombre || cuenta.id}</h4>
                        <span className={styles['cuenta-categoria']}>{cuenta.categoria}</span>
                      </div>
                      <div className={styles['cuenta-detalles']}>
                        Vencimiento: {new Date(cuenta.fechaVencimiento).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles['cuenta-montos']}>
                      <div className={cuenta.estaPagada ? styles['text-success'] : styles['text-danger']}>
                        {cuenta.estaPagada ? 'Pagada' : 'Pendiente'}
                      </div>
                      <div className={styles['cuenta-monto']}>
                        ${Number(cuenta.monto).toLocaleString()}
                      </div>
                      <div className={styles['cuenta-pagado']}>
                        Pagado: ${Number(cuenta.totalPagado).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              
              {mes.cuentas.length === 0 && (
                <p className={styles['empty-state']}>No hay cuentas para este mes.</p>
              )}
            </div>
          )}
        </div>
      ))}
      
      {agrupacion === 'mes' && (!datosAgrupados.porMes || datosAgrupados.porMes.length === 0) && !loading && (
        <p className={styles['empty-state']}>No hay datos para mostrar con los filtros actuales.</p>
      )}
    </div>
  );
};

export default HistorialListado;
