import React, { useState } from 'react';
import Modal from '../Modal';
import PagoForm from '../PagoForm';

const formatoFecha = (fechaISO) => {
  if (!fechaISO) return 'N/A';
  try {
    const date = new Date(fechaISO);
    if (isNaN(date.getTime())) {
      const timestamp = parseInt(fechaISO, 10);
      if (!isNaN(timestamp)) {
        return new Date(timestamp).toLocaleDateString('es-CL');
      }
      return 'Fecha inválida';
    }
    return date.toLocaleDateString('es-CL');
  } catch (e) {
    console.error("Error formateando fecha:", fechaISO, e);
    return 'Error fecha';
  }
};

const formatoMoneda = (valor) => {
  const num = Number(valor);
  return num.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
};

const GestionCuentasDetalle = ({ cuenta, pagoInfo, loadingPagoInfo, onCancelar, onEditarCuenta, error, onPagoRegistrado }) => {
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const handleEditClick = () => {
    if (onEditarCuenta) {
      onEditarCuenta();
    }
  };

  const handlePagoSuccess = () => {
    setShowPagoModal(false);
    if (onPagoRegistrado) onPagoRegistrado(); // Llama al callback del padre
  };

  if (!cuenta) return null;

  const getProveedorDisplay = (cuenta) => {
    if (cuenta.proveedor_nombre) {
      return cuenta.proveedor_nombre;
    }
    if (cuenta.proveedor) {
      return `ID: ${cuenta.proveedor}`;
    }
    return 'No especificado';
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
    <div className="form-area-gc detalle-panel">
      <div className="panel-header">
        <h3>Detalles de la Cuenta</h3>
        <button onClick={onCancelar} className="close-panel-btn" aria-label="Cerrar panel">&times;</button>
      </div>
      <div className="panel-content">
        {error && <div className="error-message detalle-error">{error}</div>}
        {/* Información General */}
        <div className="detalle-seccion">
          <h4><span role="img" aria-label="info">📄</span> Información General</h4>
          <div className="detalle-item"><span className="detalle-label">Categoría:</span><span>{cuenta.categoria}</span></div>
          <div className="detalle-item"><span className="detalle-label">Proveedor:</span><span>{getProveedorDisplay(cuenta)}</span></div>
          <div className="detalle-item"><span className="detalle-label">Monto:</span><span style={{fontWeight:600, color:'#1976d2'}}>{formatoMoneda(cuenta.monto)}</span></div>
          <div className="detalle-item"><span className="detalle-label">Fecha Vencimiento:</span><span>{formatoFecha(cuenta.fecha_vencimiento)}</span></div>
          {cuenta.fecha_emision && (<div className="detalle-item"><span className="detalle-label">Fecha Emisión:</span><span>{formatoFecha(cuenta.fecha_emision)}</span></div>)}
          {cuenta.descripcion && (<div className="detalle-item"><span className="detalle-label">Descripción:</span><span>{cuenta.descripcion}</span></div>)}
          <div className="detalle-item"><span className="detalle-label">Creado por:</span><span>{cuenta.creador_username || 'Desconocido'}</span></div>
          <div className="detalle-item"><span className="detalle-label">Fecha Creación:</span><span>{formatoFecha(cuenta.fecha_creacion)}</span></div>
          {cuenta.fecha_actualizacion && (<div className="detalle-item"><span className="detalle-label">Última Actualización:</span><span>{formatoFecha(cuenta.fecha_actualizacion)}</span></div>)}
        </div>
        {/* Factura/Boleta */}
        <div className="detalle-seccion">
          <h4><span role="img" aria-label="factura">📑</span> Factura / Boleta</h4>
          {cuenta.factura ? (
            <div style={{marginBottom:8}}>
              <a href={cuenta.factura} target="_blank" rel="noopener noreferrer" className="btn-ver-archivo" style={{marginRight:10}}>
                Ver {getFileNameFromUrl(cuenta.factura) || 'Factura'}
              </a>
              <a href={cuenta.factura} download className="btn-ver-archivo">
                Descargar
              </a>
              {/* Preview de imagen o PDF con click para agrandar */}
              <div style={{marginTop:10, cursor:'zoom-in'}} onClick={() => setPreviewFile(cuenta.factura)}>
                {cuenta.factura.match(/\.(jpg|jpeg|png)$/i) ? (
                  <img src={cuenta.factura} alt="Factura adjunta" style={{maxWidth:'100%', maxHeight:'180px', borderRadius:'8px', border:'1px solid #e0e0e0'}} />
                ) : cuenta.factura.match(/\.(pdf)$/i) ? (
                  <iframe src={cuenta.factura} title="Factura PDF" width="100%" height="180px" style={{border:'1px solid #e0e0e0', borderRadius:'8px'}} />
                ) : null}
              </div>
              <div style={{fontSize:'0.93em', color:'#888'}}>Haz clic en la miniatura para agrandar</div>
            </div>
          ) : (
            <p style={{color:'#888'}}>No hay factura/boleta adjunta.</p>
          )}
        </div>
        {/* Historial de Pagos */}
        <div className="detalle-seccion">
          <h4><span role="img" aria-label="pagos">💸</span> Historial de Pagos</h4>
          {loadingPagoInfo ? (
            <p>Cargando información de pagos...</p>
          ) : pagoInfo && pagoInfo.length > 0 ? (
            <ul className="lista-pagos-detalle">
              {pagoInfo.map(pago => (
                <li key={pago.id} className="pago-item-detalle">
                  <span style={{fontWeight:600, color:'#43a047'}}>Pagado el: {formatoFecha(pago.fecha_pago)}</span>
                  <span>Monto: {formatoMoneda(pago.monto_pagado)}</span>
                  <span>Por: {pago.pagado_por_username || 'Desconocido'}</span>
                  {pago.comprobante && (
                    <>
                      <a href={pago.comprobante} target="_blank" rel="noopener noreferrer" className="btn-ver-archivo btn-ver-comprobante">Ver Comprobante</a>
                      <a href={pago.comprobante} download className="btn-ver-archivo btn-ver-comprobante">Descargar</a>
                      <div style={{marginTop:8, cursor:'zoom-in'}} onClick={() => setPreviewFile(pago.comprobante)}>
                        {pago.comprobante.match(/\.(jpg|jpeg|png)$/i) ? (
                          <img src={pago.comprobante} alt="Comprobante adjunto" style={{maxWidth:'100%', maxHeight:'120px', borderRadius:'8px', border:'1px solid #e0e0e0'}} />
                        ) : pago.comprobante.match(/\.(pdf)$/i) ? (
                          <iframe src={pago.comprobante} title="Comprobante PDF" width="100%" height="120px" style={{border:'1px solid #e0e0e0', borderRadius:'8px'}} />
                        ) : null}
                      </div>
                      <div style={{fontSize:'0.93em', color:'#888'}}>Haz clic en la miniatura para agrandar</div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{color:'#888'}}>Esta cuenta aún no tiene pagos registrados.</p>
          )}
        </div>
      </div>
      {/* Acciones fijas en la parte inferior del panel */}
      <div className="panel-actions" style={{marginTop:'auto', display:'flex', gap:12, justifyContent:'flex-end'}}>
        <button onClick={handleEditClick} className="submit-button">Editar Cuenta</button>
        <button onClick={onCancelar} className="cancel-button">Cerrar</button>
        <button onClick={() => setShowPagoModal(true)} className="btn-pago" style={{background:'#43a047', color:'#fff', fontWeight:600}}>Registrar Pago</button>
      </div>
      {showPagoModal && (
        <Modal onClose={() => setShowPagoModal(false)}>
          <PagoForm cuenta={cuenta} onSuccess={handlePagoSuccess} onCancel={() => setShowPagoModal(false)} />
        </Modal>
      )}
      {/* Modal para preview grande de imagen/PDF */}
      {previewFile && (
        <Modal onClose={() => setPreviewFile(null)}>
          <div style={{maxWidth:'90vw', maxHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
            {previewFile.match(/\.(jpg|jpeg|png)$/i) ? (
              <img src={previewFile} alt="Preview" style={{maxWidth:'90vw', maxHeight:'75vh', borderRadius:'12px', border:'1.5px solid #e0e0e0'}} />
            ) : previewFile.match(/\.(pdf)$/i) ? (
              <iframe src={previewFile} title="Preview PDF" width="90vw" height="75vh" style={{border:'1.5px solid #e0e0e0', borderRadius:'12px'}} />
            ) : null}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GestionCuentasDetalle;
