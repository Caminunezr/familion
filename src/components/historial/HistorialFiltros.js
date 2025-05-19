import React from 'react';
import styles from './Historial.module.css';

const obtenerMesNombreCompleto = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
};

const HistorialFiltros = ({
  filtros,
  categorias,
  mesesDisponibles,
  mesSeleccionado,
  agrupacion,
  onFilterChange,
  onAgrupacionChange,
  onMesChange,
  onExport
}) => {
  const { fechaInicio, fechaFin, categoria, estado } = filtros;

  const handleInputChange = (e) => {
    onFilterChange(e.target.name, e.target.value);
  };

  // Asegurarse de que categorias sea un array antes de mapear
  const categoriasOptions = Array.isArray(categorias) ? categorias : [];

  return (
    <div className={styles['filtros-container']}>
      <h3 className={styles['filtros-titulo']}>Filtros</h3>
      
      <div className={styles['filtro-group']}>
        <label htmlFor="fecha-inicio">Desde:</label>
        <input
          type="date"
          id="fecha-inicio"
          name="fechaInicio"
          value={fechaInicio}
          onChange={handleInputChange}
        />
      </div>

      <div className={styles['filtro-group']}>
        <label htmlFor="fecha-fin">Hasta:</label>
        <input
          type="date"
          id="fecha-fin"
          name="fechaFin"
          value={fechaFin}
          onChange={handleInputChange}
        />
      </div>

      <div className={styles['filtro-group']}>
        <label htmlFor="categoria">Categoría:</label>
        <select
          id="categoria"
          name="categoria"
          value={categoria}
          onChange={handleInputChange}
        >
          <option value="todas">Todas las categorías</option>
          {categoriasOptions.map(cat => (
            <option key={cat.id || cat.nombre} value={cat.nombre || cat.id}>{cat.nombre || cat.id}</option>
          ))}
        </select>
      </div>

      <div className={styles['filtro-group']}>
        <label htmlFor="estado">Estado:</label>
        <select
          id="estado"
          name="estado"
          value={estado}
          onChange={handleInputChange}
        >
          <option value="todos">Todos</option>
          <option value="pagadas">Pagadas</option>
          <option value="pendientes">Pendientes</option>
        </select>
      </div>
      
      <div className={styles['filtro-group']}>
        <label htmlFor="mes-seleccionado">Mes:</label>
        <select
          id="mes-seleccionado"
          value={mesSeleccionado}
          onChange={(e) => onMesChange(e.target.value)}
        >
          {mesesDisponibles.map(mes => (
            <option key={mes} value={mes}>{obtenerMesNombreCompleto(mes)}</option>
          ))}
        </select>
      </div>

      <div className={styles['agrupacion-container']}>
        <span>Agrupar por:</span>
        <div className={styles['agrupacion-buttons']}>
          <button
            type="button"
            className={`${agrupacion === 'mes' ? styles.active : ''}`}
            onClick={() => onAgrupacionChange('mes')}
          >
            Mes
          </button>
          <button
            type="button"
            className={`${agrupacion === 'categoria' ? styles.active : ''}`}
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
        <i className="fas fa-download"></i> Exportar a CSV
      </button>
    </div>
  );
};

export default HistorialFiltros;
