import React, { useState } from 'react';
import FileViewer from './FileViewer';
import styles from './CuentaDetalle.module.css';

const CuentaDetalle = ({ cuenta, onBackClick, onPagoClick }) => {
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [mostrarComprobantes, setMostrarComprobantes] = useState(false);

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES');
  };

  if (!cuenta) return null;

  return (
    <div className={styles.cuentaDetalle}>
      <div className={styles.cuentaDetalleHeader}>
        {onBackClick && (
          <button className={styles.backButton} onClick={onBackClick}>
            ← Volver
          </button>
        )}
        <h2>{cuenta.nombre}</h2>
      </div>
      <div className={styles.cuentaDetalleInfo}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Proveedor:</span>
          <span className={styles.infoValue}>{cuenta.proveedor || 'No especificado'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Monto:</span>
          <span className={`${styles.infoValue} ${styles.monto}`}>${Number(cuenta.monto).toLocaleString()}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Fecha de vencimiento:</span>
          <span className={styles.infoValue}>{cuenta.fechaVencimiento ? new Date(cuenta.fechaVencimiento).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Categoría:</span>
          <span className={styles.infoValue}>{cuenta.categoria || 'Sin categoría'}</span>
        </div>
        {cuenta.descripcion && (
          <div className={styles.infoDescription}>
            <span className={styles.infoLabel}>Descripción:</span>
            <p>{cuenta.descripcion}</p>
          </div>
        )}
      </div>
      <div className={styles.cuentaDetalleActions}>
        {cuenta.facturaUrl && (
          <button 
            className={styles.verFacturaButton}
            onClick={() => setMostrarFactura(!mostrarFactura)}
          >
            {mostrarFactura ? 'Ocultar factura' : 'Ver factura'}
          </button>
        )}
        {cuenta.pagosCuenta && cuenta.pagosCuenta.length > 0 && (
          <button
            className={styles.verComprobanteButton}
            onClick={() => setMostrarComprobantes(!mostrarComprobantes)}
          >
            {mostrarComprobantes ? 'Ocultar comprobantes' : 'Ver comprobantes de pago'}
          </button>
        )}
        {onPagoClick && (
          <button className={styles.pagoButton} onClick={onPagoClick}>
            Registrar pago
          </button>
        )}
      </div>
      {mostrarFactura && cuenta.facturaUrl && (
        <FileViewer filePath={cuenta.facturaUrl} />
      )}
      {mostrarComprobantes && cuenta.pagosCuenta && cuenta.pagosCuenta.length > 0 && (
        <div className={styles.comprobantesLista}>
          {cuenta.pagosCuenta.map((pago, idx) => (
            pago.rutaComprobante ? (
              <div key={idx} style={{ marginBottom: 16 }}>
                <span style={{ fontWeight: 500 }}>Comprobante de pago {idx + 1}:</span>
                <FileViewer filePath={pago.rutaComprobante} />
              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
};

export default CuentaDetalle;
