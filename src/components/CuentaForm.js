import React, { useState } from 'react';
import db from '../utils/database';
import { saveFile } from '../utils/fileStorage';
import { useAuth } from '../contexts/AuthContext';
import './CuentaForm.css';

const CuentaForm = ({ onSuccess, onCancel }) => {
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
  const [error, setError] = useState('');

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
    
    try {
      let rutaFactura = null;
      
      if (factura) {
        rutaFactura = await saveFile(factura, 'facturas');
      }
      
      // Guardar en IndexedDB
      await db.cuentas.add({
        ...formData,
        monto: parseFloat(formData.monto),
        rutaFactura,
        usuarioCreacion: currentUser.uid,
        fechaCreacion: new Date().toISOString()
      });
      
      setFormData({
        nombre: '',
        proveedor: '',
        monto: '',
        fechaVencimiento: '',
        categoria: '',
        descripcion: ''
      });
      setFactura(null);
      setError('');
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al guardar cuenta:', error);
      setError('Error al guardar la cuenta');
    }
  };

  // Renderizado del formulario
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
        <label className="file-input-label" htmlFor="factura">Factura (PDF o imagen)</label>
        <input 
          type="file"
          id="factura"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      </div>
      
      <div className="form-buttons">
        {onCancel && 
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancelar
          </button>
        }
        <button type="submit" className="submit-button">
          Guardar cuenta
        </button>
      </div>
    </form>
  );
};

export default CuentaForm;
