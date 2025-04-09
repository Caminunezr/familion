import React from 'react';

// Asumiendo que las funciones de navegación y setActiveTab se pasan como props
const AccionesRapidas = ({ irAGestionCuentas, irAPresupuesto, setActiveTab }) => {
  return (
    <div className="acciones-rapidas">
      <div className="section-header">
        <h3>Acciones Rápidas</h3>
      </div>
      <div className="acciones-grid">
        <button className="accion-button" onClick={irAGestionCuentas}>
          <span className="accion-icon">📝</span>
          <span className="accion-text">Crear Nueva Cuenta</span>
        </button>
        <button className="accion-button" onClick={irAPresupuesto}>
          <span className="accion-icon">📊</span>
          <span className="accion-text">Ver Presupuesto</span>
        </button>
        <button className="accion-button" onClick={() => setActiveTab('cuentas')}>
          <span className="accion-icon">💸</span>
          <span className="accion-text">Pagar Cuenta</span>
        </button>
        <button className="accion-button" onClick={() => setActiveTab('historial')}>
          <span className="accion-icon">📅</span>
          <span className="accion-text">Ver Historial</span>
        </button>
      </div>
    </div>
  );
};

export default AccionesRapidas;
