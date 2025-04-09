import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
// ChartJS debe estar registrado en el componente padre (Dashboard.js) o aquí

const DashboardGraficos = ({ datosPorCategoria, comparativaMeses }) => {
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 15, padding: 15 }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className="graficos-container">
      <div className="grafico-box">
        <h3>Distribución de Gastos</h3>
        {datosPorCategoria.labels?.length > 0 ? (
          <div className="grafico-donut">
            <Doughnut data={datosPorCategoria} options={doughnutOptions} />
          </div>
        ) : (
          <div className="empty-state">No hay datos suficientes para mostrar</div>
        )}
      </div>

      <div className="grafico-box">
        <h3>Comparativa con Mes Anterior</h3>
        {comparativaMeses.labels?.length > 0 ? (
          <div className="grafico-barras">
            <Bar data={comparativaMeses} options={barOptions} />
          </div>
        ) : (
          <div className="empty-state">No hay datos suficientes para mostrar</div>
        )}
      </div>
    </div>
  );
};

export default DashboardGraficos;
