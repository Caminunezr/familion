// src/components/historial/HistorialDetalles.js
import React from 'react';
import styles from './Historial.module.css';
import Modal from '../Modal';

const HistorialDetalles = ({ cuenta, onClose }) => {
  if (!cuenta) return null;
  
  return (
    <Modal title={`Detalles de ${cuenta.nombre || 'Cuenta'}`} onClose={onClose}>
      <div className={styles['detalles-container']}>
        <div className={styles['detalles-header']}>
          <h3>{cuenta.nombre || cuenta.id}</h3>
          <span className={`${styles['detalles-estado']} ${cuenta.estaPagada ? styles['text-success'] : styles['text-danger']}`}>
            {cuenta.estaPagada ? 'Pagada' : 'Pendiente'}
          </span>
        </div>
        
        <div className={styles['detalles-info']}>
          <div className={styles['detalles-campo']}>
            <span className={styles['campo-label']}>Categoría:</span>
            <span className={styles['campo-valor']}>{cuenta.categoria}</span>
          </div>
          
          <div className={styles['detalles-campo']}>
            <span className={styles['campo-label']}>Monto:</span>
            <span className={styles['campo-valor']}>${Number(cuenta.monto).toLocaleString()}</span>
          </div>
          
          <div className={styles['detalles-campo']}>
            <span className={styles['campo-label']}>Total Pagado:</span>
            <span className={styles['campo-valor']}>${Number(cuenta.totalPagado).toLocaleString()}</span>
          </div>
          
          <div className={styles['detalles-campo']}>
            <span className={styles['campo-label']}>Fecha de Vencimiento:</span>
            <span className={styles['campo-valor']}>{new Date(cuenta.fechaVencimiento).toLocaleDateString()}</span>
          </div>
          
          {cuenta.fechaEmision && (
            <div className={styles['detalles-campo']}>
              <span className={styles['campo-label']}>Fecha de Emisión:</span>
              <span className={styles['campo-valor']}>{new Date(cuenta.fechaEmision).toLocaleDateString()}</span>
            </div>
          )}
          
          {cuenta.descripcion && (
            <div className={styles['detalles-campo-full']}>
              <span className={styles['campo-label']}>Descripción:</span>
              <p className={styles['campo-descripcion']}>{cuenta.descripcion}</p>
            </div>
          )}
        </div>
        
        {cuenta.pagosCuenta && cuenta.pagosCuenta.length > 0 && (
          <div className={styles['detalles-pagos']}>
            <h4>Historial de Pagos</h4>
            <table className={styles['pagos-tabla']}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {cuenta.pagosCuenta.map((pago, index) => (
                  <tr key={index}>
                    <td>{new Date(pago.fechaPago).toLocaleDateString()}</td>
                    <td>${Number(pago.montoPagado).toLocaleString()}</td>
                    <td>{pago.usuario?.username || 'Usuario'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className={styles['detalles-botones']}>
          <button className={styles['btn-cerrar']} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default HistorialDetalles;
