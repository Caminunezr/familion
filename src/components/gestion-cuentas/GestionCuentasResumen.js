import React from 'react';

// Componente interno para las tarjetas de resumen (rediseño visual)
const ResumenCard = ({ titulo, valor, icono, colorFondo, colorIcono }) => (
  <div className="resumen-card-gc resumen-card-redesign" style={{ borderLeft: `8px solid ${colorIcono}` }}>
    <div className="resumen-icono-gc icon-circle" style={{ background: colorFondo, color: colorIcono }}>
      {icono}
    </div>
    <div className="resumen-card-content">
      <div className="resumen-valor-gc valor-destacado">{valor}</div>
      <div className="resumen-titulo-gc titulo-mayus">{titulo}</div>
    </div>
  </div>
);

const GestionCuentasResumen = ({ resumen }) => {
  // Paleta de colores para cada tarjeta
  const tarjetas = [
    {
      titulo: 'Total de Cuentas',
      valor: resumen.total,
      icono: '📊',
      colorFondo: 'rgba(33,150,243,0.10)',
      colorIcono: '#1976d2',
    },
    {
      titulo: 'Cuentas Pendientes',
      valor: resumen.pendientes,
      icono: '⏳',
      colorFondo: 'rgba(255,193,7,0.13)',
      colorIcono: '#ffc107',
    },
    {
      titulo: 'Monto Total',
      valor: `$${resumen.montoTotal.toLocaleString()}`,
      icono: '💰',
      colorFondo: 'rgba(76,175,80,0.10)',
      colorIcono: '#43a047',
    },
    {
      titulo: 'Próximas a Vencer',
      valor: resumen.proximas,
      icono: '🔔',
      colorFondo: 'rgba(220,53,69,0.10)',
      colorIcono: '#dc3545',
    },
  ];
  return (
    <div className="resumen-cards-gc">
      {tarjetas.map((t, i) => (
        <ResumenCard key={t.titulo} {...t} />
      ))}
    </div>
  );
};

export default GestionCuentasResumen;
