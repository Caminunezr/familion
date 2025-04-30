import React from 'react';

const PresupuestoCrearForm = ({
  mesActual,
  formCrearData,
  formLoading,
  onInputChange,
  onSubmit
}) => (
  <div className="crear-presupuesto-section card">
    <h3>Crear Presupuesto para {mesActual}</h3>
    <p>Aún no existe un presupuesto para este mes.</p>
    <form onSubmit={onSubmit} className="crear-presupuesto-form">
      <div className="form-group">
        <label htmlFor="montoObjetivo">Monto Objetivo Mensual *</label>
        <input
          type="number"
          id="montoObjetivo"
          name="montoObjetivo"
          min="0"
          step="1000"
          value={formCrearData.montoObjetivo}
          onChange={e => onInputChange(e, 'crear')}
          required
          placeholder="Ej: 500000"
        />
      </div>
      <button type="submit" className="submit-button" disabled={formLoading}>
        {formLoading ? 'Creando...' : 'Crear Presupuesto'}
      </button>
    </form>
  </div>
);

export default PresupuestoCrearForm;
