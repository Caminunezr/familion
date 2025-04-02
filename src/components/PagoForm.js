import React, { useState, useEffect } from 'react';
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
  const [presupuestosMes, setPresupuestosMes] = useState([]);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState('');
  const [registrarComoAporte, setRegistrarComoAporte] = useState(true);

  // Buscar presupuestos del mes actual al cargar el componente
  useEffect(() => {
    const fetchPresupuestos = async () => {
      try {
        // Obtener el mes actual en formato YYYY-MM
        const fechaPago = new Date(formData.fechaPago);
        const mesActual = `${fechaPago.getFullYear()}-${String(fechaPago.getMonth() + 1).padStart(2, '0')}`;
        
        // Buscar presupuestos para este mes
        const presupuestosData = await db.presupuestos
          .where('mes')
          .equals(mesActual)
          .toArray();
        
        setPresupuestosMes(presupuestosData);
        
        // Si hay solo un presupuesto, seleccionarlo automáticamente
        if (presupuestosData.length === 1) {
          setPresupuestoSeleccionado(presupuestosData[0].id.toString());
        }
      } catch (error) {
        console.error('Error al buscar presupuestos:', error);
      }
    };
    
    fetchPresupuestos();
  }, [formData.fechaPago]);

  // Actualizar la búsqueda de presupuestos cuando cambia la fecha de pago
  useEffect(() => {
    const actualizarPresupuestos = async () => {
      try {
        const fechaPago = new Date(formData.fechaPago);
        const mesPago = `${fechaPago.getFullYear()}-${String(fechaPago.getMonth() + 1).padStart(2, '0')}`;
        
        // Buscar presupuestos para este mes
        const presupuestosData = await db.presupuestos
          .where('mes')
          .equals(mesPago)
          .toArray();
        
        setPresupuestosMes(presupuestosData);
        
        // Resetear la selección si no hay presupuestos
        if (presupuestosData.length === 0) {
          setPresupuestoSeleccionado('');
        } 
        // Seleccionar automáticamente si solo hay uno
        else if (presupuestosData.length === 1) {
          setPresupuestoSeleccionado(presupuestosData[0].id.toString());
        }
      } catch (error) {
        console.error('Error al actualizar presupuestos:', error);
      }
    };
    
    actualizarPresupuestos();
  }, [formData.fechaPago]);

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

  const handlePresupuestoChange = (e) => {
    setPresupuestoSeleccionado(e.target.value);
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
      const pagoData = {
        cuentaId: cuenta.id,
        montoPagado: parseFloat(formData.montoPagado),
        fechaPago: formData.fechaPago,
        metodoPago: formData.metodoPago,
        pagadoPor: currentUser.uid,
        rutaComprobante,
        fechaCreacion: new Date().toISOString()
      };
      
      const pagoId = await db.pagos.add(pagoData);
      
      // Si se seleccionó registrar como aporte y hay un presupuesto seleccionado
      if (registrarComoAporte && presupuestoSeleccionado) {
        const presupuestoId = parseInt(presupuestoSeleccionado);
        
        // Crear un aporte automático
        await db.aportes.add({
          presupuestoId,
          miembroId: currentUser.uid,
          monto: parseFloat(formData.montoPagado),
          fechaAporte: formData.fechaPago,
          rutaComprobante,
          fechaCreacion: new Date().toISOString(),
          tipoPago: 'cuenta', // Para identificar que proviene de un pago de cuenta
          cuentaId: cuenta.id,
          cuentaNombre: cuenta.nombre,
          pagoId // Referencia al pago que generó este aporte
        });
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al guardar pago:', error);
      setError('Error al guardar el pago');
    } finally {
      setLoading(false);
    }
  };

  // Formatear mes para mostrar
  const formatoMes = (mesString) => {
    const [año, mes] = mesString.split('-');
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return `${nombresMeses[parseInt(mes) - 1]} ${año}`;
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
      
      {/* Sección para incluir en presupuesto */}
      <div className="presupuesto-section">
        <div className="form-info-box">
          <p><strong>Información importante:</strong> Registrar este pago te eximirá de aportar parte o todo de los $150,000 mensuales, dependiendo del monto pagado.</p>
        </div>
        
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="registrarComoAporte"
            checked={registrarComoAporte}
            onChange={(e) => setRegistrarComoAporte(e.target.checked)}
          />
          <label htmlFor="registrarComoAporte">
            Incluir como aporte al presupuesto mensual
          </label>
        </div>
        
        {registrarComoAporte && (
          <div className="form-group">
            <label htmlFor="presupuesto">Seleccionar presupuesto</label>
            {presupuestosMes.length === 0 ? (
              <div className="no-presupuesto-warning">
                No hay presupuestos para este mes. <a href="/presupuesto" target="_blank" rel="noopener noreferrer">Crear uno</a>
              </div>
            ) : (
              <select
                id="presupuesto"
                value={presupuestoSeleccionado}
                onChange={handlePresupuestoChange}
                required={registrarComoAporte}
              >
                <option value="">Seleccionar presupuesto</option>
                {presupuestosMes.map(p => (
                  <option key={p.id} value={p.id}>
                    {formatoMes(p.mes)} - {p.creadorNombre}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
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
          disabled={loading || (registrarComoAporte && presupuestosMes.length > 0 && !presupuestoSeleccionado)}
        >
          {loading ? 'Guardando...' : 'Registrar Pago'}
        </button>
      </div>
    </form>
  );
};

export default PagoForm;
