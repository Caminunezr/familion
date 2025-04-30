import React from 'react';

// Componente interno para las tarjetas de resumen
const ResumenCard = ({ titulo, valor, icono }) => (
  <div className="resumen-card-gc">
    <div className="resumen-icono-gc">{icono}</div>
    <div className="resumen-valor-gc">{valor}</div>
    <div className="resumen-titulo-gc">{titulo}</div>
  </div>
);

const GestionCuentasResumen = ({ resumen }) => {
  return (
    <div className="resumen-cards-gc">
      <ResumenCard titulo="Total de Cuentas" valor={resumen.total} icono="📊" />
      <ResumenCard titulo="Cuentas Pendientes" valor={resumen.pendientes} icono="⏳" />
      <ResumenCard titulo="Monto Total" valor={`$${resumen.montoTotal.toLocaleString()}`} icono="💰" />
      <ResumenCard titulo="Próximas a Vencer" valor={resumen.proximas} icono="🔔" />
    </div>
  );
};

export default GestionCuentasResumen;
