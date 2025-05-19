// src/components/historial/HistorialComparativa.js
import React, { useState } from 'react';
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
  const periodos = comparativa?.porPeriodo || defaultComparativaData.porPeriodo;
  const [abiertos, setAbiertos] = useState({});

  const togglePeriodo = (periodo) => {
    setAbiertos(prev => ({ ...prev, [periodo]: !prev[periodo] }));
  };

  if (periodos.length === 0) {
    return (
      <div className={styles['comparativa-container']}>
        <h3 className={styles['tabla-titulo']}>Comparativa por Periodos</h3>
        <p className={styles['empty-state']}>No hay datos suficientes para comparar periodos.</p>
      </div>
    );
  }

  return (
    <div className={styles['comparativa-container']}>
      <h3 className={styles['tabla-titulo']}>Comparativa por Periodos</h3>
      <div className={styles['historial-listado']}>
        {periodos.map((periodo, idx) => (
          <div key={periodo.periodo} className={styles['mes-card']}>
            <div
              className={styles['mes-header']}
              onClick={() => togglePeriodo(periodo.periodo)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles['mes-info']}>
                <span className={styles['mes-nombre']}>{obtenerMesNombreCompleto(periodo.periodo)}</span>
                <span className={styles['mes-estadisticas']}>
                  {periodo.totalCuentas || 0} cuentas · ${Number(periodo.totalMonto || 0).toLocaleString()} ·
                  <span className={
                    periodo.porcentajePagado >= 75
                      ? styles['text-success']
                      : periodo.porcentajePagado > 0
                        ? styles['text-warning']
                        : styles['text-danger']
                  }>
                    {Number(periodo.porcentajePagado || 0)}% pagado
                  </span>
                </span>
              </div>
              <span className={styles['mes-toggle']}>
                {abiertos[periodo.periodo] ? '▼' : '▶'}
              </span>
            </div>
            {abiertos[periodo.periodo] && (
              <div className={styles['mes-cuentas']}>
                <div style={{ padding: '12px 0', color: styles['color-texto-secundario'] }}>
                  <b>Total pagado:</b> ${Number(periodo.montoPagado || 0).toLocaleString()}<br />
                  <b>Porcentaje pagado:</b> {Number(periodo.porcentajePagado || 0)}%<br />
                  {/* Aquí se pueden agregar más detalles por periodo si se desea */}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorialComparativa;
