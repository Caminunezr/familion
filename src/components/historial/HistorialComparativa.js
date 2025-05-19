// src/components/historial/HistorialComparativa.js
import React from 'react';
import styles from './Historial.module.css';

// Estructura por defecto
const defaultComparativaData = {
  porPeriodo: []
};

const obtenerMesNombreCompleto = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
};

const HistorialComparativa = ({ comparativa = defaultComparativaData }) => {
  // Acceso seguro
  const periodos = comparativa?.porPeriodo || defaultComparativaData.porPeriodo;

  return (
    <div className={styles['comparativa-container']}>
      <h3 className={styles['tabla-titulo']}>Comparativa por Periodos</h3>
      {periodos.length === 0 ? (
        <p className={styles['empty-state']}>No hay datos suficientes para comparar periodos.</p>
      ) : (
        <div className={styles['comparativa-tabla']}>
          <div className={styles['comparativa-header']}>
            <div>Periodo</div>
            <div>Monto Total</div>
            <div>Total Pagado</div>
            <div>% Pagado</div>
          </div>
          <div className={styles['comparativa-body']}>
            {periodos.map((periodo, index) => (
              <div key={index} className={styles['comparativa-fila']}>
                <div>{obtenerMesNombreCompleto(periodo.periodo) || 'N/A'}</div>
                <div>${(periodo.totalMonto || 0).toLocaleString()}</div>
                <div>${(periodo.montoPagado || 0).toLocaleString()}</div>
                <div className={periodo.porcentajePagado >= 75 ? styles['text-success'] : styles['text-warning']}>
                  {(periodo.porcentajePagado || 0).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialComparativa;
