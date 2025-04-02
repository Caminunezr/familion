import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import db from '../utils/database';
import { saveFile } from '../utils/fileStorage';
import './PagoForm.css';

const PagoForm = ({ cuenta, onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    montoPagado: cuenta ? cuenta.monto.toString() : '',
    fechaPago: new Date().toISOString().split('T')[0],
    metodoPago: ''
  });
  const [comprobante, setComprobante] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setComprobante(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.montoPagado || !formData.fechaPago) {
      setError('El monto y la fecha de pago son obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      let rutaComprobante = null;
      
      if (comprobante) {
        rutaComprobante = await saveFile(comprobante, 'comprobantes');
      }
      
      // Guardar el pago
      await db.pagos.add({
        cuentaId: cuenta.id,
        montoPagado: parseFloat(formData.montoPagado),
        fechaPago: formData.fechaPago,
        metodoPago: formData.metodoPago,
        pagadoPor: currentUser.uid,
        rutaComprobante,
        fechaCreacion: new Date().toISOString()
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al guardar pago:', error);
      setError('Error al guardar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="pago-form" onSubmit={handleSubmit}>
      <h3>Registrar Pago para: {cuenta?.nombre}</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="montoPagado">Monto Pagado *</label>
        <input
          type="number"
          id="montoPagado"
          name="montoPagado"
          value={formData.montoPagado}
          onChange={handleChange}
          step="0.01"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="fechaPago">Fecha de Pago *</label>
        <input
          type="date"
          id="fechaPago"
          name="fechaPago"
          value={formData.fechaPago}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="metodoPago">Método de Pago</label>
        <select
          id="metodoPago"
          name="metodoPago"
          value={formData.metodoPago}
          onChange={handleChange}
        >
          <option value="">Seleccionar método</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta_debito">Tarjeta de Débito</option>
          <option value="tarjeta_credito">Tarjeta de Crédito</option>
          <option value="transferencia">Transferencia</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="comprobante">Comprobante de Pago</label>
        <input
          type="file"
          id="comprobante"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      </div>
      
      <div className="form-buttons">
        <button 
          type="button" 
          className="cancel-button" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Registrar Pago'}
        </button>
      </div>
    </form>
  );
};

export default PagoForm;
