import React, { useState } from 'react';
import FileViewer from './FileViewer';
import './CuentaDetalle.css';

const CuentaDetalle = ({ cuenta, onBackClick, onPagoClick }) => {
  const [mostrarFactura, setMostrarFactura] = useState(false);

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES');
  };

  return (
    <div className="cuenta-detalle">
      <div className="cuenta-detalle-header">
        <button className="back-button" onClick={onBackClick}>
          ← Volver
        </button>
        <h2>{cuenta.nombre}</h2>
      </div>
      
      <div className="cuenta-detalle-info">
        <div className="info-row">
          <span className="info-label">Proveedor:</span>
          <span className="info-value">{cuenta.proveedor || 'No especificado'}</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">Monto:</span>
          <span className="info-value monto">${cuenta.monto.toFixed(2)}</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">Fecha de vencimiento:</span>
          <span className="info-value">{formatFecha(cuenta.fechaVencimiento)}</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">Categoría:</span>
          <span className="info-value">{cuenta.categoria || 'Sin categoría'}</span>
        </div>
        
        {cuenta.descripcion && (
          <div className="info-description">
            <span className="info-label">Descripción:</span>
            <p>{cuenta.descripcion}</p>
          </div>
        )}
      </div>
      
      <div className="cuenta-detalle-actions">
        {cuenta.rutaFactura && (
          <button 
            className="ver-factura-button"
            onClick={() => setMostrarFactura(!mostrarFactura)}
          >
            {mostrarFactura ? 'Ocultar factura' : 'Ver factura'}
          </button>
        )}
        
        <button className="pago-button" onClick={onPagoClick}>
          Registrar pago
        </button>
      </div>
      
      {mostrarFactura && cuenta.rutaFactura && (
        <FileViewer filePath={cuenta.rutaFactura} />
      )}
    </div>
  );
};

export default CuentaDetalle;
