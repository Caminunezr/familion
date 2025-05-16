import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const PagoForm = ({ cuenta, onSuccess, onCancel, presupuestosDisponibles = [] }) => {
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
  const [aportes, setAportes] = useState([]);
  const [aporteId, setAporteId] = useState('');
  const [presupuestoId, setPresupuestoId] = useState(cuenta.presupuesto || cuenta.presupuesto_id || (presupuestosDisponibles[0]?.id || ''));

  useEffect(() => {
    // Obtener aportes disponibles para el presupuesto de la cuenta
    const fetchAportes = async () => {
      try {
        const id = presupuestoId;
        if (!id) { setAportes([]); return; }
        const token = localStorage.getItem('access');
        const res = await axios.get(`http://localhost:8000/api/aportes/?presupuesto=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAportes(res.data);
      } catch (err) {
        setAportes([]);
      }
    };
    fetchAportes();
  }, [presupuestoId]);

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
      formData.append('cuenta', Number(cuenta.id));
      formData.append('monto_pagado', Number(montoPagado));
      formData.append('fecha_pago', fechaPago);
      if (comprobante) formData.append('comprobante', comprobante);
      if (aporteId) formData.append('aporte', aporteId);
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
          console.log('Detalle error backend:', errorJson);
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
        {/* Si no hay presupuesto asociado, permitir seleccionar uno */}
        {!cuenta.presupuesto && !cuenta.presupuesto_id && presupuestosDisponibles.length > 0 && (
          <div className="form-group">
            <label>Presupuesto *</label>
            <select value={presupuestoId} onChange={e => setPresupuestoId(e.target.value)} required disabled={loading}>
              <option value="">-- Selecciona un presupuesto --</option>
              {presupuestosDisponibles.map(p => (
                <option key={p.id} value={p.id}>{p.familia} - {p.fecha_mes}</option>
              ))}
            </select>
          </div>
        )}
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
          <label>Aporte utilizado *</label>
          <select value={aporteId} onChange={e => setAporteId(e.target.value)} required disabled={loading || aportes.length === 0}>
            <option value="">-- Selecciona un aporte --</option>
            {aportes.map(aporte => (
              <option key={aporte.id} value={aporte.id}>
                {aporte.nombreAportador || aporte.usuarioUsername || 'Aporte'} - ${aporte.monto}
              </option>
            ))}
          </select>
          {aportes.length === 0 && <div style={{color:'#e53935',marginTop:6}}>No hay aportes disponibles para este presupuesto.</div>}
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
