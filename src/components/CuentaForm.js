import React, { useState, useEffect } from 'react';
import db from '../utils/database';
import { saveFile } from '../utils/fileStorage';
import { useAuth } from '../contexts/AuthContext';
import './CuentaForm.css';

const CuentaForm = ({ cuentaToEdit, onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    proveedor: '',
    monto: '',
    fechaVencimiento: '',
    categoria: '',
    descripcion: ''
  });
  const [factura, setFactura] = useState(null);
  const [facturaActual, setFacturaActual] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditing = !!cuentaToEdit;

  // Cargar datos existentes si estamos editando
  useEffect(() => {
    if (cuentaToEdit) {
      setFormData({
        nombre: cuentaToEdit.nombre || '',
        proveedor: cuentaToEdit.proveedor || '',
        monto: cuentaToEdit.monto.toString() || '',
        fechaVencimiento: cuentaToEdit.fechaVencimiento || '',
        categoria: cuentaToEdit.categoria || '',
        descripcion: cuentaToEdit.descripcion || ''
      });
      setFacturaActual(cuentaToEdit.rutaFactura);
    }
  }, [cuentaToEdit]);

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
    
    if (!formData.nombre || !formData.monto) {
      setError('El nombre y el monto son obligatorios');
      return;
    }
    
    setLoading(true);
    
    try {
      let rutaFactura = facturaActual;
      
      // Si hay un nuevo archivo de factura, guardarlo
      if (factura) {
        rutaFactura = await saveFile(factura, 'facturas');
      }
      
      const cuentaData = {
        ...formData,
        monto: parseFloat(formData.monto),
        rutaFactura,
        usuarioCreacion: isEditing ? cuentaToEdit.usuarioCreacion : currentUser.uid,
        fechaCreacion: isEditing ? cuentaToEdit.fechaCreacion : new Date().toISOString(),
        fechaModificacion: new Date().toISOString()
      };
      
      if (isEditing) {
        // Actualizar cuenta existente
        await db.cuentas.update(cuentaToEdit.id, cuentaData);
      } else {
        // Crear nueva cuenta
        await db.cuentas.add(cuentaData);
      }
      
      // Limpiar el formulario si no estamos editando
      if (!isEditing) {
        setFormData({
          nombre: '',
          proveedor: '',
          monto: '',
          fechaVencimiento: '',
          categoria: '',
          descripcion: ''
        });
        setFactura(null);
        setFacturaActual(null);
      }
      
      setError('');
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(`Error al ${isEditing ? 'actualizar' : 'guardar'} cuenta:`, error);
      setError(`Error al ${isEditing ? 'actualizar' : 'guardar'} la cuenta`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="cuenta-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <label htmlFor="nombre">Nombre de la cuenta *</label>
      <input 
        type="text"
        id="nombre"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        required
      />
      
      <label htmlFor="proveedor">Proveedor</label>
      <input 
        type="text"
        id="proveedor"
        name="proveedor"
        value={formData.proveedor}
        onChange={handleChange}
      />
      
      <label htmlFor="monto">Monto *</label>
      <input 
        type="number"
        id="monto"
        name="monto"
        value={formData.monto}
        onChange={handleChange}
        step="0.01"
        required
      />
      
      <label htmlFor="fechaVencimiento">Fecha de vencimiento</label>
      <input 
        type="date"
        id="fechaVencimiento"
        name="fechaVencimiento"
        value={formData.fechaVencimiento}
        onChange={handleChange}
      />
      
      <label htmlFor="categoria">Categoría</label>
      <select
        id="categoria"
        name="categoria"
        value={formData.categoria}
        onChange={handleChange}
      >
        <option value="">Seleccionar categoría</option>
        <option value="servicios">Servicios</option>
        <option value="alimentos">Alimentos</option>
        <option value="transporte">Transporte</option>
        <option value="entretenimiento">Entretenimiento</option>
        <option value="salud">Salud</option>
        <option value="educacion">Educación</option>
        <option value="otros">Otros</option>
      </select>
      
      <label htmlFor="descripcion">Descripción</label>
      <textarea
        id="descripcion"
        name="descripcion"
        value={formData.descripcion}
        onChange={handleChange}
      ></textarea>
      
      <div className="file-input-container">
        <label className="file-input-label" htmlFor="factura">
          {facturaActual ? 'Cambiar factura actual' : 'Factura (PDF o imagen)'}
        </label>
        {facturaActual && (
          <div className="factura-actual">
            <span className="factura-icon">📄</span>
            Ya existe una factura adjunta
          </div>
        )}
        <input 
          type="file"
          id="factura"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      </div>
      
      <div className="form-buttons">
        {onCancel && 
          <button type="button" className="cancel-button" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        }
        <button type="submit" className="submit-button" disabled={loading}>
          {loading 
            ? 'Guardando...' 
            : isEditing 
              ? 'Actualizar cuenta' 
              : 'Guardar cuenta'}
        </button>
      </div>
    </form>
  );
};

export default CuentaForm;
