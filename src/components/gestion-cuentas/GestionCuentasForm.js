import React from 'react';

const GestionCuentasForm = ({
  formData: initialFormData,
  onInputChange,
  onFileChange,
  onEliminarFacturaChange,
  onGuardarCuenta,
  onCancelar,
  categorias,
  proveedores,
  formLoading,
  error,
  isEditing,
  cuentaActual,
}) => {
  const formData = initialFormData;

  const requiereDescripcion = formData.categoria === 'Otros';

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardarCuenta();
  };

  const getFileNameFromUrl = (url) => {
    if (!url) return '';
    try {
      const decodedUrl = decodeURIComponent(url);
      const parts = decodedUrl.split('/');
      const fileNameWithToken = parts.pop() || '';
      const fileName = fileNameWithToken.split('?')[0];
      const nameParts = fileName.split('_');
      if (nameParts.length > 1 && nameParts[0].length > 10) {
        nameParts.shift();
        return nameParts.join('_');
      }
      return fileName;
    } catch (error) {
      console.error("Error extrayendo nombre de archivo:", error);
      return 'archivo adjunto';
    }
  };

  return (
    <div className="form-area-gc">
      <div className="form-header">
        <h3>{isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}</h3>
        {/* Eliminada la X de cerrar, ya la provee el Modal */}
      </div>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="panel-content">
          {error && <div className="error-message form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="categoria">Categoría *</label>
            <select
              id="categoria"
              name="categoria"
              value={formData.categoria}
              onChange={onInputChange}
              required
              disabled={formLoading}
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="proveedor">Proveedor *</label>
            <select
              id="proveedor"
              name="proveedor"
              value={formData.proveedor}
              onChange={onInputChange}
              required
              disabled={formLoading || !formData.categoria || proveedores.length === 0}
            >
              <option value="">{formData.categoria ? 'Selecciona un proveedor' : 'Selecciona categoría primero'}</option>
              {proveedores.map(prov => (
                <option key={prov.id} value={prov.id}>{prov.nombre}</option>
              ))}
            </select>
            {!formLoading && formData.categoria && proveedores.length === 0 && (
              <small className="text-muted">No hay proveedores registrados para esta categoría.</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="monto">Monto *</label>
            <input
              type="number"
              id="monto"
              name="monto"
              value={formData.monto}
              onChange={onInputChange}
              required
              min="0.01"
              step="0.01"
              disabled={formLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fechaEmision">Fecha de Emisión</label>
            <input
              type="date"
              id="fechaEmision"
              name="fechaEmision"
              value={formData.fechaEmision}
              onChange={onInputChange}
              disabled={formLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fechaVencimiento">Fecha de Vencimiento *</label>
            <input
              type="date"
              id="fechaVencimiento"
              name="fechaVencimiento"
              value={formData.fechaVencimiento}
              onChange={onInputChange}
              required
              disabled={formLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">
              Descripción {requiereDescripcion ? '*' : ''}
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={onInputChange}
              rows="3"
              maxLength={200}
              required={requiereDescripcion}
              disabled={formLoading}
            ></textarea>
            {requiereDescripcion && <small>La descripción será usada como nombre para esta categoría.</small>}
          </div>

          <div className="form-group">
            <label htmlFor="facturaFile">Factura/Boleta (PDF, JPG, PNG)</label>
            {isEditing && cuentaActual?.factura && (
              <div className="factura-actual-info">
                <span>Archivo actual: </span>
                <a href={cuentaActual.factura} target="_blank" rel="noopener noreferrer">
                  {getFileNameFromUrl(cuentaActual.factura)}
                </a>
                <label style={{ marginLeft: '15px', fontWeight: 'normal' }}>
                  <input
                    type="checkbox"
                    name="eliminarFactura"
                    checked={formData.eliminarFactura || false}
                    onChange={onEliminarFacturaChange}
                    disabled={formLoading}
                    style={{ marginRight: '5px', verticalAlign: 'middle' }}
                  />
                  Eliminar archivo al guardar
                </label>
              </div>
            )}
            <input
              type="file"
              id="facturaFile"
              name="facturaFile"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={onFileChange}
              disabled={formLoading || (isEditing && cuentaActual?.factura && formData.eliminarFactura)}
              style={{ marginTop: '5px' }}
            />
          </div>
        </div>
        <div className="form-buttons">
          <button type="button" className="cancel-button" onClick={onCancelar} disabled={formLoading}>
            Cancelar
          </button>
          <button type="submit" className="submit-button" disabled={formLoading}>
            {formLoading ? 'Guardando...' : (isEditing ? 'Actualizar Cuenta' : 'Guardar Cuenta')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GestionCuentasForm;
