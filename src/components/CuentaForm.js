import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveFile } from '../utils/fileStorage';
import './CuentaForm.css';

const CuentaForm = ({ cuenta, categorias, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '', // Ahora será para el nombre específico cuando es "Otros"
    monto: '',
    proveedor: '',
    fechaVencimiento: '',
    categoria: '',
    descripcion: '',
    categoriaEspecifica: '' // Para el nombre específico cuando la categoría es "Otros"
  });
  const [mostrarCampoOtros, setMostrarCampoOtros] = useState(false);
  const [factura, setFactura] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Cargar datos de la cuenta si existe
  useEffect(() => {
    if (cuenta) {
      // Lista de categorías válidas
      const categoriasValidas = ['Luz', 'Agua', 'Gas', 'Internet', 'Utiles de Aseo', 'Otros'];
      
      // Si la categoría no es válida, mapearla o usar "Otros"
      let categoria = cuenta.categoria || '';
      if (!categoriasValidas.includes(categoria)) {
        // Mapeo para categorías antiguas
        const categoriasMapping = {
          'servicios': 'Luz',
          'alimentos': 'Agua',
          'transporte': 'Gas',
          'entretenimiento': 'Internet',
          'salud': 'Utiles de Aseo',
          'educacion': 'Otros'
        };
        
        categoria = categoriasMapping[categoria.toLowerCase()] || 'Otros';
      }
      
      setFormData({
        nombre: cuenta.nombre || '',
        monto: cuenta.monto || '',
        proveedor: cuenta.proveedor || '',
        fechaVencimiento: cuenta.fechaVencimiento ? cuenta.fechaVencimiento.split('T')[0] : '',
        categoria: categoria,
        descripcion: cuenta.descripcion || '',
        categoriaEspecifica: categoria === 'Otros' ? cuenta.nombre : cuenta.categoriaEspecifica || ''
      });
      
      setMostrarCampoOtros(categoria === 'Otros');
    }
  }, [cuenta]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Mostrar el campo adicional si se selecciona "Otros"
    if (name === 'categoria') {
      setMostrarCampoOtros(value === 'Otros');
    }
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
      if (formData.categoria === 'Otros' && !formData.categoriaEspecifica.trim()) {
        throw new Error('Debes especificar un nombre para la categoría "Otros"');
      }
      
      if (!formData.monto || isNaN(formData.monto) || parseFloat(formData.monto) <= 0) {
        throw new Error('El monto debe ser un número mayor que cero');
      }
      
      // Construir objeto de cuenta
      const cuentaData = {
        // Usar la categoría como nombre, excepto cuando es "Otros"
        nombre: formData.categoria === 'Otros' ? formData.categoriaEspecifica.trim() : formData.categoria,
        monto: parseFloat(formData.monto),
        proveedor: formData.proveedor.trim(),
        categoria: formData.categoria,
        descripcion: formData.descripcion.trim(),
        fechaVencimiento: formData.fechaVencimiento ? new Date(formData.fechaVencimiento).toISOString() : null,
        categoriaEspecifica: formData.categoria === 'Otros' ? formData.categoriaEspecifica.trim() : null
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
        <label htmlFor="categoria">Tipo de Cuenta/Servicio*</label>
        <select
          id="categoria"
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
          required
        >
          <option value="">Seleccionar tipo</option>
          {/* Filtrar categorías para asegurar que no haya duplicados */}
          {Array.from(new Set(categorias.map(cat => cat.nombre))).map(nombreCategoria => (
            <option key={nombreCategoria} value={nombreCategoria}>
              {nombreCategoria}
            </option>
          ))}
        </select>
      </div>

      {mostrarCampoOtros && (
        <div className="form-group">
          <label htmlFor="categoriaEspecifica">Especificar Nombre*</label>
          <input
            type="text"
            id="categoriaEspecifica"
            name="categoriaEspecifica"
            value={formData.categoriaEspecifica}
            onChange={handleChange}
            placeholder="Ej: Reparación, Mantenimiento, etc."
            required
          />
        </div>
      )}
      
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
