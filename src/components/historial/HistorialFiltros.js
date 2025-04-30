import React from 'react';
import styles from './Historial.module.css';

const HistorialFiltros = ({
  filtros,
  categorias,
  agrupacion,
  onFilterChange,
  onAgrupacionChange,
  onExport
}) => {
  const { filtroFechaInicio, filtroFechaFin, filtroCategoria, filtroEstado } = filtros;

  const handleInputChange = (e) => {
    onFilterChange(e.target.name, e.target.value);
  };

  // Asegurarse de que categorias sea un array antes de mapear
  const categoriasOptions = Array.isArray(categorias) ? categorias : [];

  return (
    <div className={styles['filtros-container']}>
      <h3 className={styles['filtros-titulo']}>Filtros</h3>
      <div className={styles['filtros-grid']}>
        <div className={styles['filtro-group']}>
          <label htmlFor="fecha-inicio">Desde:</label>
          <input
            type="date"
            id="fecha-inicio"
            name="filtroFechaInicio"
            value={filtroFechaInicio}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles['filtro-group']}>
          <label htmlFor="fecha-fin">Hasta:</label>
          <input
            type="date"
            id="fecha-fin"
            name="filtroFechaFin"
            value={filtroFechaFin}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles['filtro-group']}>
          <label htmlFor="categoria">Categoría:</label>
          <select
            id="categoria"
            name="filtroCategoria"
            value={filtroCategoria}
            onChange={handleInputChange}
          >
            <option value="todas">Todas las categorías</option>
            {categoriasOptions.map(cat => (
              <option key={cat.id || cat.nombre} value={cat.nombre}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        <div className={styles['filtro-group']}>
          <label htmlFor="estado">Estado:</label>
          <select
            id="estado"
            name="filtroEstado"
            value={filtroEstado}
            onChange={handleInputChange}
          >
            <option value="todos">Todos</option>
            <option value="pagadas">Pagadas</option>
            <option value="pendientes">Pendientes</option>
          </select>
        </div>
      </div>

      <div className={styles['agrupacion-container']}>
        <span>Agrupar por:</span>
        <div className={styles['agrupacion-buttons']}>
          <button
            type="button"
            className={agrupacion === 'mes' ? styles.active : ''}
            onClick={() => onAgrupacionChange('mes')}
          >
            Mes
          </button>
          <button
            type="button"
            className={agrupacion === 'categoria' ? styles.active : ''}
            onClick={() => onAgrupacionChange('categoria')}
          >
            Categoría
          </button>
        </div>
      </div>

      <button
        type="button"
        className={styles['export-button']}
        onClick={onExport}
      >
        Exportar a CSV
      </button>
    </div>
  );
};

export default HistorialFiltros;
