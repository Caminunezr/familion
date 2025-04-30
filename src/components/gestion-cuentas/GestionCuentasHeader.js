import React from 'react';

const GestionCuentasHeader = ({ onAbrirFormularioNuevo }) => {
  return (
    <div className="gestion-header">
      <h2>Gestión de Cuentas</h2>
      <button className="crear-cuenta-btn" onClick={onAbrirFormularioNuevo}>
        + Crear Cuenta
      </button>
    </div>
  );
};

export default GestionCuentasHeader;
