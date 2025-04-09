import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
// Asegúrate que ChartJS está registrado en Historial.js o aquí si es necesario
// import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
// ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HistorialGraficos = ({ datosPorCategoria, datosTendencias }) => {
  // Opciones podrían definirse aquí o pasarse como props si son dinámicas
  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 15, padding: 15 }
      }
    }
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Evolución de pagos por mes' }
    },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className="graficos-container">
      <div className="grafico-card">
        <h3>Distribución por Categoría</h3>
        {datosPorCategoria.labels?.length > 0 ? (
          <div className="grafico-dona">
            <Doughnut data={datosPorCategoria} options={doughnutOptions} />
          </div>
        ) : (
          <div className="no-data">No hay suficientes datos para mostrar el gráfico</div>
        )}
      </div>
      <div className="grafico-card">
        <h3>Tendencia por Mes</h3>
        {datosTendencias.labels?.length > 0 ? (
          <div className="grafico-barras">
            <Bar data={datosTendencias} options={barOptions} />
          </div>
        ) : (
          <div className="no-data">No hay suficientes datos para mostrar el gráfico</div>
        )}
      </div>
    </div>
  );
};

export default HistorialGraficos;
