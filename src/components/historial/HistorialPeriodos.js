import React from 'react';
import styles from './Historial.module.css';

// Estructura por defecto
const defaultComparativaData = {
  porPeriodo: []
};

const HistorialPeriodos = ({ comparativa = defaultComparativaData }) => {
  // Acceso seguro
  const periodos = comparativa?.porPeriodo || defaultComparativaData.porPeriodo;

  return (
    <div className={styles['periodos-container'] + ' ' + styles['card']}>
      <h3 className={styles['periodos-titulo']}>Comparativa por Periodos</h3>
      {periodos.length === 0 ? (
        <p className={styles['empty-state']}>No hay datos suficientes para comparar periodos.</p>
      ) : (
        <div className={styles['periodos-tabla']}>
          <div className={styles['periodos-header']}>
            <div>Periodo</div>
            <div>Monto Total</div>
            <div>Total Pagado</div>
            <div>% Pagado</div>
          </div>
          <div className={styles['periodos-body']}>
            {periodos.map((periodo, index) => (
              <div key={index} className={styles['periodo-fila']}>
                <div>{periodo.nombrePeriodo || 'N/A'}</div>
                <div>${(periodo.montoTotal || 0).toLocaleString()}</div>
                <div>${(periodo.totalPagado || 0).toLocaleString()}</div>
                <div>{(periodo.porcentajePagado || 0).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialPeriodos;
