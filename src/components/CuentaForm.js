import React, { useState } from 'react';
import styles from './CuentaForm.module.css';

const CuentaForm = ({ formData, onInputChange, onFileChange, onEliminarFacturaChange, onGuardarCuenta, onCancelar, categorias, proveedores, formLoading, error, isEditing, cuentaActual }) => {
  const [facturaPreview, setFacturaPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    onFileChange(e);
    if (file) {
      const url = URL.createObjectURL(file);
      setFacturaPreview(url);
    } else {
      setFacturaPreview(null);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h3>{isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}</h3>
        <button className={styles.closeBtn} onClick={onCancelar} aria-label="Cerrar">&times;</button>
      </div>
      <div className={styles.formContent}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <div className={styles.formGroup}>
          <label>Categoría *</label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={onInputChange}
            className={styles.select}
            required
            disabled={formLoading}
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Proveedor *</label>
          <select
            name="proveedor"
            value={formData.proveedor}
            onChange={onInputChange}
            className={styles.select}
            required
            disabled={formLoading}
          >
            <option value="">Selecciona un proveedor</option>
            {proveedores.map(prov => (
              <option key={prov.id} value={prov.id}>{prov.nombre}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Monto *</label>
          <input
            type="number"
            name="monto"
            value={formData.monto}
            onChange={onInputChange}
            className={styles.input}
            min="0.01"
            step="0.01"
            required
            disabled={formLoading}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Fecha de vencimiento *</label>
          <input
            type="date"
            name="fechaVencimiento"
            value={formData.fechaVencimiento}
            onChange={onInputChange}
            className={styles.input}
            required
            disabled={formLoading}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Fecha de emisión</label>
          <input
            type="date"
            name="fechaEmision"
            value={formData.fechaEmision}
            onChange={onInputChange}
            className={styles.input}
            disabled={formLoading}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={onInputChange}
            className={styles.textarea}
            disabled={formLoading}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Factura/Boleta</label>
          <input
            type="file"
            name="factura"
            onChange={handleFileChange}
            className={styles.input}
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={formLoading}
          />
          {facturaPreview && (
            <div className={styles.filePreview}>
              {facturaPreview.match(/\.(jpg|jpeg|png)$/i) ? (
                <img src={facturaPreview} alt="Preview" />
              ) : facturaPreview.match(/\.(pdf)$/i) ? (
                <iframe src={facturaPreview} title="Factura PDF" />
              ) : null}
            </div>
          )}
          {isEditing && cuentaActual && cuentaActual.factura && (
            <div style={{marginTop:8}}>
              <span style={{fontSize:'0.97em', color:'#888'}}>Factura actual adjunta.</span>
              <br />
              <input
                type="checkbox"
                name="eliminarFactura"
                checked={!!formData.eliminarFactura}
                onChange={onEliminarFacturaChange}
                disabled={formLoading}
              /> Eliminar factura actual
            </div>
          )}
        </div>
      </div>
      <div className={styles.formButtons}>
        <button type="button" className={styles.cancelBtn} onClick={onCancelar} disabled={formLoading}>Cancelar</button>
        <button type="button" onClick={onGuardarCuenta} disabled={formLoading}>{formLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}</button>
      </div>
    </div>
  );
};

export default CuentaForm;
