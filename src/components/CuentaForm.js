import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveFile } from '../utils/fileStorage';
import './CuentaForm.css';

const CuentaForm = ({ cuenta, categorias, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    monto: '',
    proveedor: '',
    fechaVencimiento: '',
    categoria: '',
    descripcion: ''
  });
  const [factura, setFactura] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Cargar datos de la cuenta si existe
  useEffect(() => {
    if (cuenta) {
      setFormData({
        nombre: cuenta.nombre || '',
        monto: cuenta.monto || '',
        proveedor: cuenta.proveedor || '',
        fechaVencimiento: cuenta.fechaVencimiento ? cuenta.fechaVencimiento.split('T')[0] : '',
        categoria: cuenta.categoria || '',
        descripcion: cuenta.descripcion || ''
      });
    }
  }, [cuenta]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFactura(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Validaciones básicas
      if (!formData.nombre.trim()) {
        throw new Error('El nombre de la cuenta es obligatorio');
      }
      
      if (!formData.monto || isNaN(formData.monto) || parseFloat(formData.monto) <= 0) {
        throw new Error('El monto debe ser un número mayor que cero');
      }
      
      // Construir objeto de cuenta
      const cuentaData = {
        nombre: formData.nombre.trim(),
        monto: parseFloat(formData.monto),
        proveedor: formData.proveedor.trim(),
        categoria: formData.categoria,
        descripcion: formData.descripcion.trim(),
        fechaVencimiento: formData.fechaVencimiento ? new Date(formData.fechaVencimiento).toISOString() : null
      };
      
      // Si hay una factura nueva, guardarla
      if (factura) {
        const rutaFactura = await saveFile(factura, 'facturas');
        cuentaData.rutaFactura = rutaFactura;
      } else if (cuenta && cuenta.rutaFactura) {
        // Mantener la factura existente si no se cambia
        cuentaData.rutaFactura = cuenta.rutaFactura;
      }
      
      // Si es edición, mantener el ID
      if (cuenta) {
        cuentaData.id = cuenta.id;
      }
      
      // Guardar la cuenta
      onSave(cuentaData);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form className="cuenta-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="nombre">Nombre de la cuenta*</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="monto">Monto*</label>
        <input
          type="number"
          id="monto"
          name="monto"
          value={formData.monto}
          onChange={handleChange}
          min="1"
          step="1"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="proveedor">Proveedor</label>
        <input
          type="text"
          id="proveedor"
          name="proveedor"
          value={formData.proveedor}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="fechaVencimiento">Fecha de vencimiento</label>
        <input
          type="date"
          id="fechaVencimiento"
          name="fechaVencimiento"
          value={formData.fechaVencimiento}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="categoria">Categoría</label>
        <select
          id="categoria"
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
        >
          <option value="">Seleccionar categoría</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.nombre}>
              {cat.nombre.charAt(0).toUpperCase() + cat.nombre.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows="4"
        ></textarea>
      </div>
      
      <div className="file-input-container">
        <label className="file-input-label">Factura o comprobante</label>
        
        {cuenta && cuenta.rutaFactura && !factura && (
          <div className="factura-actual">
            <span className="factura-icon">📄</span>
            Factura actual: {cuenta.rutaFactura.split('/')[1]}
          </div>
        )}
        
        <input
          type="file"
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
          {loading ? 'Guardando...' : cuenta ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default CuentaForm;
