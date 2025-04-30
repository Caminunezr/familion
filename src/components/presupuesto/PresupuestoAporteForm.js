import React, { useState } from 'react';

const PresupuestoAporteForm = ({
  onSubmit,
  formLoading = false,
  error = '',
  initialData = { monto: '', aportadorNombre: '' }
}) => {
  const [formData, setFormData] = useState(initialData);

  React.useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ ...formData });
    setFormData(initialData); // Limpiar después de enviar
  };

  return (
    <div className="agregar-aporte-section card">
      <h4>Registrar Aporte Manual</h4>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="agregar-aporte-form">
        <div className="form-group">
          <label htmlFor="montoAporte">Monto Aportado *</label>
          <input
            type="number"
            id="montoAporte"
            name="monto"
            min="0"
            step="1000"
            value={formData.monto}
            onChange={handleChange}
            required
            placeholder="Ej: 50000"
          />
        </div>
        <div className="form-group">
          <label htmlFor="aportadorNombre">Aportado por *</label>
          <select
            id="aportadorNombre"
            name="aportadorNombre"
            value={formData.aportadorNombre}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un miembro</option>
            <option value="Camilo">Camilo</option>
            <option value="Chave">Chave</option>
            <option value="Daniela">Daniela</option>
            <option value="Mia">Mia</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <button type="submit" className="submit-button" disabled={formLoading}>
          {formLoading ? 'Guardando...' : 'Agregar Aporte'}
        </button>
      </form>
    </div>
  );
};

export default PresupuestoAporteForm;
