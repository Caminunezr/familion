import React from 'react';

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

  return (
    <div className="filtros-container">
      <h3>Filtros</h3>
      <div className="filtros-grid">
        <div className="filtro-group">
          <label htmlFor="fecha-inicio">Desde:</label>
          <input
            type="date"
            id="fecha-inicio"
            name="filtroFechaInicio" // Usar name para identificar el filtro
            value={filtroFechaInicio}
            onChange={handleInputChange}
          />
        </div>

        <div className="filtro-group">
          <label htmlFor="fecha-fin">Hasta:</label>
          <input
            type="date"
            id="fecha-fin"
            name="filtroFechaFin" // Usar name
            value={filtroFechaFin}
            onChange={handleInputChange}
          />
        </div>

        <div className="filtro-group">
          <label htmlFor="categoria">Categoría:</label>
          <select
            id="categoria"
            name="filtroCategoria" // Usar name
            value={filtroCategoria}
            onChange={handleInputChange}
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.id || cat.nombre} value={cat.nombre}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label htmlFor="estado">Estado:</label>
          <select
            id="estado"
            name="filtroEstado" // Usar name
            value={filtroEstado}
            onChange={handleInputChange}
          >
            <option value="todos">Todos</option>
            <option value="pagadas">Pagadas</option>
            <option value="pendientes">Pendientes</option>
          </select>
        </div>
      </div>

      <div className="agrupacion-container">
        <span>Agrupar por:</span>
        <div className="agrupacion-buttons">
          <button
            type="button"
            className={agrupacion === 'mes' ? 'active' : ''}
            onClick={() => onAgrupacionChange('mes')}
          >
            Mes
          </button>
          <button
            type="button"
            className={agrupacion === 'categoria' ? 'active' : ''}
            onClick={() => onAgrupacionChange('categoria')}
          >
            Categoría
          </button>
        </div>
      </div>

      <button
        type="button"
        className="export-button"
        onClick={onExport}
      >
        Exportar a CSV
      </button>
    </div>
  );
};

export default HistorialFiltros;
