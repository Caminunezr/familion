import React from 'react';

// Asumiendo que resumenFinanciero y cuentasPendientes se pasan como props
const ResumenCards = ({ resumenFinanciero, cuentasPendientes }) => {
  return (
    <div className="resumen-cards">
      <div className="resumen-card presupuesto-card">
        <div className="card-icon budget-icon">💰</div>
        <div className="card-content">
          <h3>Presupuesto Mensual</h3>
          <div className="card-value">${resumenFinanciero.presupuestoTotal.toLocaleString()}</div>
          <div className="card-footer">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${resumenFinanciero.progreso}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {resumenFinanciero.progreso.toFixed(0)}% completado
            </div>
          </div>
        </div>
      </div>

      <div className="resumen-card pendiente-card">
        <div className="card-icon pending-icon">⏳</div>
        <div className="card-content">
          <h3>Pendiente por Pagar</h3>
          <div className="card-value">${resumenFinanciero.totalPendiente.toLocaleString()}</div>
          <div className="card-footer">
            {cuentasPendientes.length} cuenta(s) pendiente(s)
          </div>
        </div>
      </div>

      <div className="resumen-card pagado-card">
        <div className="card-icon paid-icon">✅</div>
        <div className="card-content">
          <h3>Total Pagado</h3>
          <div className="card-value">${resumenFinanciero.totalPagado.toLocaleString()}</div>
          <div className="card-footer tendencia">
            {resumenFinanciero.tendencia > 0 ? (
              <span className="tendencia-up">↑ {resumenFinanciero.tendencia.toFixed(1)}% que el mes anterior</span>
            ) : resumenFinanciero.tendencia < 0 ? (
              <span className="tendencia-down">↓ {Math.abs(resumenFinanciero.tendencia).toFixed(1)}% que el mes anterior</span>
            ) : (
              <span className="tendencia-equal">= Igual que el mes anterior</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumenCards;
