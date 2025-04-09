import React from 'react';

// Asumiendo que formatMonto se pasa como prop o se importa de utils
const HistorialResumen = ({ resumenGeneral, formatMonto }) => {
  return (
    <div className="resumen-container">
      <h3>Resumen General</h3>
      <div className="resumen-cards">
        <div className="resumen-card">
          <div className="card-icon total-icon">📊</div>
          <div className="card-content">
            <div className="card-title">Total de Cuentas</div>
            <div className="card-value">{resumenGeneral.totalCuentas}</div>
          </div>
        </div>
        <div className="resumen-card">
          <div className="card-icon monto-icon">💰</div>
          <div className="card-content">
            <div className="card-title">Monto Total</div>
            <div className="card-value">{formatMonto(resumenGeneral.totalMonto)}</div>
          </div>
        </div>
        <div className="resumen-card">
          <div className="card-icon pagado-icon">✅</div>
          <div className="card-content">
            <div className="card-title">Total Pagado</div>
            <div className="card-value">{formatMonto(resumenGeneral.totalPagado)}</div>
          </div>
        </div>
        <div className="resumen-card">
          <div className="card-icon progreso-icon">📈</div>
          <div className="card-content">
            <div className="card-title">Porcentaje Pagado</div>
            <div className="card-value">{resumenGeneral.porcentajePagado}%</div>
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${resumenGeneral.porcentajePagado}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorialResumen;
