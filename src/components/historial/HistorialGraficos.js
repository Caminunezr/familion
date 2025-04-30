import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import styles from './Historial.module.css';
// Asegúrate que ChartJS esté registrado (probablemente en Dashboard.js o Historial.js)

// Definir estructura por defecto más robusta
const defaultGraficosData = {
  categorias: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
  pagosVsVencimientos: { labels: [], datasets: [{ label: '', data: [], backgroundColor: '' }] }
};

const HistorialGraficos = ({ graficos = defaultGraficosData }) => {
  // Acceso seguro a las propiedades, usando la estructura por defecto si es necesario
  const datosCategorias = graficos?.categorias || defaultGraficosData.categorias;
  const datosPagosVencimientos = graficos?.pagosVsVencimientos || defaultGraficosData.pagosVsVencimientos;

  // Opciones para el gráfico de dona (categorías)
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 15, padding: 15, color: '#1976d2', font: { family: 'Segoe UI', size: 14 } }
      },
      title: {
        display: true,
        text: 'Distribución por Categoría',
        color: '#1976d2',
        font: { family: 'Segoe UI', size: 18, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: $${value.toLocaleString()}`;
          }
        }
      }
    },
    animation: { duration: 900, easing: 'easeOutQuart' },
    layout: { padding: 10 },
  };

  // Opciones para el gráfico de barras (evolución mensual)
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#1976d2', font: { family: 'Segoe UI', size: 14 } } },
      title: {
        display: true,
        text: 'Pagos por Mes',
        color: '#1976d2',
        font: { family: 'Segoe UI', size: 18, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Pagado: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#1976d2', font: { family: 'Segoe UI', size: 13 } },
        grid: { color: '#e3f2fd' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#1976d2', font: { family: 'Segoe UI', size: 13 } },
        grid: { color: '#e3f2fd' }
      }
    },
    animation: { duration: 900, easing: 'easeOutQuart' },
    layout: { padding: 10 },
  };

  // Verificar si hay datos válidos para mostrar
  const hayDatosCategorias = datosCategorias.labels && datosCategorias.labels.length > 0 && datosCategorias.datasets?.[0]?.data?.length > 0;
  const hayDatosPagosVencimientos = datosPagosVencimientos.labels && datosPagosVencimientos.labels.length > 0 && datosPagosVencimientos.datasets?.[0]?.data?.length > 0;

  return (
    <div className={styles['graficos-container']}>
      <div className={styles['grafico-card']}>
        {hayDatosCategorias ? (
          <div className={styles['grafico-dona']}>
            <Doughnut data={datosCategorias} options={doughnutOptions} />
          </div>
        ) : (
          <div className={styles['empty-state']}>No hay datos de categorías para mostrar.</div>
        )}
      </div>
      <div className={styles['grafico-card']}>
        {hayDatosPagosVencimientos ? (
          <div className={styles['grafico-barras']}>
            <Bar data={datosPagosVencimientos} options={barOptions} />
          </div>
        ) : (
          <div className={styles['empty-state']}>No hay datos de comparación para mostrar.</div>
        )}
      </div>
    </div>
  );
};

export default HistorialGraficos;
