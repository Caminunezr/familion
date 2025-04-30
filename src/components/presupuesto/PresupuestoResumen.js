import React from 'react';

const formatoMoneda = (valor) =>
  valor?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

const PresupuestoResumen = ({ presupuesto, totalAportado, restante, progreso }) => {
  return (
    <div className="presupuesto-resumen card">
      <h3>Resumen del Presupuesto</h3>
      <div className="resumen-grid">
        <div className="resumen-item">
          <span className="label">Total Aportado</span>
          <span className="value">{formatoMoneda(totalAportado)}</span>
        </div>
        <div className="resumen-item">
          <span className="label">Restante</span>
          <span className={`value${restante === 0 ? ' completo' : ''}`}>{formatoMoneda(restante)}</span>
        </div>
      </div>
      <div className="progreso-container">
        <div className="progreso-label">
          <span>Progreso:</span>
          <span>{progreso.toFixed(0)}%</span>
        </div>
        <div className="progreso-barra">
          <div className="progreso-relleno" style={{ width: `${progreso}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default PresupuestoResumen;
