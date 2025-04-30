import React from 'react';

const PresupuestoHistorialSelector = ({ mesSeleccionado, onMesChange }) => {
  // Asegura formato YYYY-MM
  const handleChange = (e) => {
    onMesChange(e.target.value);
  };

  return (
    <div className="presupuesto-historial-selector">
      <label htmlFor="selector-mes">Selecciona el mes:</label>
      <input
        type="month"
        id="selector-mes"
        value={mesSeleccionado}
        onChange={handleChange}
        max={new Date().toISOString().slice(0, 7)}
        style={{ padding: '8px 14px', borderRadius: 5, border: '1px solid #ddd', fontSize: '1rem', background: '#f9f9f9' }}
      />
    </div>
  );
};

export default PresupuestoHistorialSelector;
