import React from 'react';
import styles from './Historial.module.css';

// Añadir valores por defecto para la prop 'resumen'
const HistorialResumen = ({ resumen = { totalCuentas: 0, totalMonto: 0, totalPagado: 0, porcentajePagado: 0 } }) => {
  // Acceder a las propiedades de forma segura
  const totalCuentas = resumen.totalCuentas || 0;
  const totalMonto = resumen.totalMonto || 0;
  const totalPagado = resumen.totalPagado || 0;
  const porcentajePagado = resumen.porcentajePagado || 0;

  return (
    <div className={styles['historial-resumen']}>
      <div className={styles['resumen-item']}>
        <div className={styles['resumen-valor']}>{totalCuentas}</div>
        <div className={styles['resumen-label']}>Total Cuentas</div>
      </div>
      <div className={styles['resumen-item']}>
        <div className={styles['resumen-valor']}>${totalMonto.toLocaleString()}</div>
        <div className={styles['resumen-label']}>Monto Total</div>
      </div>
      <div className={styles['resumen-item']}>
        <div className={styles['resumen-valor']}>${totalPagado.toLocaleString()}</div>
        <div className={styles['resumen-label']}>Total Pagado</div>
      </div>
      <div className={styles['resumen-item']}>
        <div className={styles['resumen-valor']}>{porcentajePagado.toFixed(0)}%</div>
        <div className={styles['resumen-label']}>Pagado</div>
      </div>
    </div>
  );
};

export default HistorialResumen;
