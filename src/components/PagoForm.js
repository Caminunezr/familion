import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const PagoForm = ({ cuenta, onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const [montoPagado, setMontoPagado] = useState(Number(cuenta.monto) || 0);
  const [fechaPago, setFechaPago] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [comprobante, setComprobante] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    setComprobante(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const token = localStorage.getItem('access');
      if (!token) throw new Error('No autenticado');
      const formData = new FormData();
      formData.append('cuenta', Number(cuenta.id)); // Aseguramos que sea número
      formData.append('monto_pagado', Number(montoPagado)); // Aseguramos que sea número
      formData.append('fecha_pago', fechaPago); // Debe ser YYYY-MM-DD
      if (comprobante) formData.append('comprobante', comprobante);
      // El usuario se asigna automáticamente en el backend
      const res = await fetch('http://localhost:8000/api/pagos/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        let msg = 'Error al registrar el pago';
        try {
          const errorJson = await res.json();
          console.log('Detalle error backend:', errorJson); // <-- para depuración
          msg += ': ' + JSON.stringify(errorJson);
        } catch {}
        throw new Error(msg);
      }
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pago-form-container">
      <h3>Registrar Pago</h3>
      <form onSubmit={handleSubmit} className="pago-form">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Pago registrado correctamente.</div>}
        <div className="form-group">
          <label>Monto pagado *</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={montoPagado}
            onChange={e => setMontoPagado(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Fecha de pago *</label>
          <input
            type="date"
            value={fechaPago}
            onChange={e => setFechaPago(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Comprobante (PDF, JPG, PNG)</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Usuario</label>
          <input
            type="text"
            value={currentUser?.username || 'Desconocido'}
            disabled
          />
        </div>
        <div className="form-buttons">
          <button type="button" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar Pago'}</button>
        </div>
      </form>
    </div>
  );
};

export default PagoForm;
