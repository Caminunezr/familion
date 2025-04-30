import React from 'react';

const GestionCuentasFiltros = ({
  searchTerm,
  onSearchChange,
  sortCriteria,
  onSortChange,
  sortDirection,
  onToggleSortDirection
}) => {
  return (
    <div className="filtros-bar-gc">
      <input
        type="text"
        placeholder="Buscar cuenta por nombre o proveedor..."
        value={searchTerm}
        onChange={onSearchChange}
        className="search-input-gc"
      />
      <div className="sort-controls-gc">
        <label htmlFor="sortCriteria">Ordenar por:</label>
        <select
          id="sortCriteria"
          value={sortCriteria}
          onChange={onSortChange}
        >
          <option value="fecha_creacion">Fecha de creación</option>
          <option value="fecha_vencimiento">Fecha de vencimiento</option>
          {/* <option value="nombre">Nombre</option>  // El campo 'nombre' puede no existir directamente */}
          <option value="monto">Monto</option>
          <option value="categoria">Categoría</option>
        </select>
        <button onClick={onToggleSortDirection} className="sort-direction-btn">
          {sortDirection === 'asc' ? 'Ascendente ↑' : 'Descendente ↓'}
        </button>
      </div>
    </div>
  );
};

export default GestionCuentasFiltros;
