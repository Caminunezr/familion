import React from 'react';
import styles from './Historial.module.css';

// Estructura por defecto
const defaultInterpretacionData = {
  mensajePrincipal: "No hay datos suficientes para generar una interpretación.",
  consejos: [],
  totalMonto: 0, // Añadir propiedades esperadas
  totalPagado: 0
};

const HistorialInterpretacion = ({ interpretacion = defaultInterpretacionData }) => {
  // Acceso seguro
  const mensajePrincipal = interpretacion?.mensajePrincipal || defaultInterpretacionData.mensajePrincipal;
  const consejos = interpretacion?.consejos || defaultInterpretacionData.consejos;
  const totalMonto = interpretacion?.totalMonto || defaultInterpretacionData.totalMonto; // Acceso seguro
  const totalPagado = interpretacion?.totalPagado || defaultInterpretacionData.totalPagado; // Acceso seguro

  return (
    <div className={styles['interpretacion-container'] + ' ' + styles['card']}>
      <h3 className={styles['interpretacion-titulo']}>Interpretación y Consejos</h3>
      <p className={styles['mensaje-principal']}>{mensajePrincipal}</p>
      {totalMonto > 0 && (
        <p className={styles['interpretacion-total']}>Monto total de cuentas en el periodo: ${totalMonto.toLocaleString()}</p>
      )}
      {totalPagado > 0 && (
        <p className={styles['interpretacion-total']}>Total pagado en el periodo: ${totalPagado.toLocaleString()}</p>
      )}
      {consejos.length > 0 && (
        <div className={styles['consejos-lista']}>
          <h4>Consejos:</h4>
          <ul>
            {consejos.map((consejo, index) => (
              <li key={index}>{consejo}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HistorialInterpretacion;
