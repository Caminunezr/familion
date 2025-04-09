import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import db from '../../utils/database';
import { getFile } from '../../utils/fileStorage';
import FileViewer from '../FileViewer';
import CuentaForm from '../CuentaForm';
import NavBar from '../NavBar';
import './GestionCuentas.css';

const GestionCuentas = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Estados para la gestión de cuentas
  const [cuentas, setCuentas] = useState([]);
  const [cuentasFiltradas, setCuentasFiltradas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [showCategorias, setShowCategorias] = useState(false);
  
  // Estados para búsqueda y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Estados para el panel lateral y formularios
  const [showForm, setShowForm] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState(null);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [viewingFactura, setViewingFactura] = useState(false);
  
  // Estados para UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);
  
  // Estadísticas
  const [stats, setStats] = useState({
    totalCuentas: 0,
    pendientes: 0, 
    montoTotal: 0,
    proximasVencer: 0
  });
  
  const contentRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Función que genera clases CSS para categorías
  const getCategoryClass = (categoria) => {
    // Convertir a slug para CSS (minúsculas, guiones en lugar de espacios)
    const slug = categoria ? categoria.toLowerCase().replace(/\s+/g, '-') : 'otros';
    return `category-${slug}`;
  };

  // Cargar datos iniciales
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener categorías
      const categoriasArray = await db.categorias.toArray();
      setCategorias(categoriasArray);
      
      // Obtener cuentas
      const cuentasArray = await db.cuentas
        .where('userId')
        .equals(currentUser.uid)
        .toArray();
      
      setCuentas(cuentasArray);
      
      // Aplicar filtros iniciales
      aplicarFiltros(cuentasArray, categoriaSeleccionada, searchTerm, sortBy, sortDirection);
      
      // Calcular estadísticas
      calcularEstadisticas(cuentasArray);
      
      // Mostrar las estadísticas con una animación suave
      setTimeout(() => setStatsVisible(true), 100);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Ocurrió un error al cargar las cuentas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [currentUser.uid, categoriaSeleccionada, searchTerm, sortBy, sortDirection]);
  
  // Cargar cuentas desde la base de datos
  const cargarCuentas = async () => {
    const cuentasData = await db.cuentas.toArray();
    setCuentas(cuentasData);
  };

  // Cargar datos cuando se monta el componente
  useEffect(() => {
    fetchData();
    cargarCuentas();
    
    // Listener para responsive
    const handleResize = () => {
      setMobileView(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchData]);

  // Cargar categorías desde la base de datos
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        setLoading(true);
        let categoriasDB = await db.categorias.toArray();
        
        // Verificar datos para depuración
        console.log("Categorías cargadas:", categoriasDB);
        
        // Filtrar para incluir solo las categorías válidas
        const categoriasValidas = ['Luz', 'Agua', 'Gas', 'Internet', 'Utiles de Aseo', 'Otros'];
        
        categoriasDB = categoriasDB.filter(cat => 
          categoriasValidas.includes(cat.nombre)
        );
        
        // Verificar que no haya duplicados
        const nombresUnicos = new Set();
        categoriasDB = categoriasDB.filter(cat => {
          if (nombresUnicos.has(cat.nombre)) return false;
          nombresUnicos.add(cat.nombre);
          return true;
        });
        
        setCategorias(categoriasDB);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        setError('Error al cargar categorías');
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  // Aplicar filtros y ordenamiento a las cuentas
  const aplicarFiltros = useCallback((cuentasArray, categoria, busqueda, ordenarPor, direccion) => {
    let result = [...cuentasArray];
    
    // Filtrar por categoría
    if (categoria !== 'todas') {
      result = result.filter(cuenta => cuenta.categoria === categoria);
    }
    
    // Filtrar por búsqueda
    if (busqueda) {
      const terminoBusqueda = busqueda.toLowerCase();
      result = result.filter(cuenta => 
        cuenta.nombre.toLowerCase().includes(terminoBusqueda) ||
        (cuenta.proveedor && cuenta.proveedor.toLowerCase().includes(terminoBusqueda))
      );
    }
    
    // Ordenar resultados
    result.sort((a, b) => {
      let valA, valB;
      
      switch (ordenarPor) {
        case 'nombre':
          valA = a.nombre.toLowerCase();
          valB = b.nombre.toLowerCase();
          break;
        case 'monto':
          valA = a.monto;
          valB = b.monto;
          break;
        case 'vencimiento':
          valA = new Date(a.fechaVencimiento || 0).getTime();
          valB = new Date(b.fechaVencimiento || 0).getTime();
          break;
        case 'fecha':
        default:
          valA = new Date(a.fechaCreacion || 0).getTime();
          valB = new Date(b.fechaCreacion || 0).getTime();
      }
      
      // Aplicar dirección de ordenamiento
      if (direccion === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
    
    setCuentasFiltradas(result);
  }, []);
  
  // Calcular estadísticas de cuentas
  const calcularEstadisticas = useCallback((cuentasArray) => {
    const hoy = new Date();
    const enDiezDias = new Date();
    enDiezDias.setDate(hoy.getDate() + 10);
    
    // Cuentas próximas a vencer (en los próximos 10 días y no pagadas)
    const proximas = cuentasArray.filter(cuenta => {
      if (!cuenta.fechaVencimiento || cuenta.estaPagada) return false;
      
      const fechaVencimiento = new Date(cuenta.fechaVencimiento);
      return fechaVencimiento >= hoy && fechaVencimiento <= enDiezDias;
    }).length;
    
    setStats({
      totalCuentas: cuentasArray.length,
      pendientes: cuentasArray.filter(cuenta => !cuenta.estaPagada).length,
      montoTotal: cuentasArray.reduce((total, cuenta) => total + cuenta.monto, 0),
      proximasVencer: proximas
    });
  }, []);
  
  // Mostrar notificación con tiempo de expiración
  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ message, type });
    if (duration) {
      setTimeout(() => setNotification(null), duration);
    }
  };
  
  // Gestionar búsqueda
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    aplicarFiltros(cuentas, categoriaSeleccionada, value, sortBy, sortDirection);
  };
  
  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
    aplicarFiltros(cuentas, categoriaSeleccionada, '', sortBy, sortDirection);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Gestionar cambio de ordenamiento
  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    aplicarFiltros(cuentas, categoriaSeleccionada, searchTerm, value, sortDirection);
  };
  
  // Gestionar cambio de dirección de ordenamiento
  const handleSortDirectionChange = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    aplicarFiltros(cuentas, categoriaSeleccionada, searchTerm, sortBy, newDirection);
  };
  
  // Gestionar selección de categoría
  const handleCategoriaChange = (categoria) => {
    setCategoriaSeleccionada(categoria);
    aplicarFiltros(cuentas, categoria, searchTerm, sortBy, sortDirection);
  };
  
  // Gestionar guardado de cuenta (nueva o editada)
  const handleSaveCuenta = async (cuentaData) => {
    try {
      if (editingCuenta) {
        // Actualizar cuenta existente
        await db.cuentas.update(editingCuenta.id, {
          ...cuentaData,
          fechaActualizacion: new Date().toISOString()
        });
        showNotification('Cuenta actualizada correctamente');
      } else {
        // Crear nueva cuenta
        await db.cuentas.add({
          ...cuentaData,
          userId: currentUser.uid,
          estaPagada: false,
          fechaCreacion: new Date().toISOString()
        });
        showNotification('Cuenta creada correctamente');
      }
      
      setShowForm(false);
      setEditingCuenta(null);
      await cargarCuentas(); // Recargar la lista de cuentas
      fetchData();
    } catch (error) {
      console.error('Error al guardar la cuenta:', error);
      showNotification('Error al guardar la cuenta', 'error');
    }
  };
  
  // Gestionar cierre de formulario
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCuenta(null);
  };
  
  // Gestionar cierre de detalles
  const handleCloseDetails = () => {
    setSelectedCuenta(null);
    setViewingFactura(false);
  };
  
  // Gestionar selección de cuenta
  const handleSelectCuenta = (cuenta) => {
    setSelectedCuenta(cuenta);
    setViewingFactura(false);
    
    if (mobileView) {
      // Scroll al inicio en vista móvil
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Gestionar clic en editar cuenta
  const handleEditCuenta = (e, cuenta) => {
    e.stopPropagation(); // Evitar que se seleccione la cuenta
    setEditingCuenta(cuenta);
    setShowForm(true);
    setSelectedCuenta(null);
    
    if (mobileView && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Gestionar clic en ver factura
  const handleViewFactura = (e, cuenta) => {
    e.stopPropagation(); // Evitar que se seleccione la cuenta
    setSelectedCuenta(cuenta);
    setViewingFactura(true);
    
    if (mobileView) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Mostrar diálogo de confirmación de eliminación
  const handleDeleteClick = (e, cuenta) => {
    e.stopPropagation(); // Evitar que se seleccione la cuenta
    setConfirmDelete(cuenta);
  };
  
  // Confirmar eliminación de cuenta
  const confirmDeleteCuenta = async () => {
    if (!confirmDelete) return;
    
    try {
      await db.cuentas.delete(confirmDelete.id);
      showNotification('Cuenta eliminada correctamente');
      
      // Si estamos viendo los detalles de la cuenta eliminada, cerrarlos
      if (selectedCuenta && selectedCuenta.id === confirmDelete.id) {
        setSelectedCuenta(null);
      }
      
      await cargarCuentas(); // Recargar la lista de cuentas
      fetchData();
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error);
      showNotification('Error al eliminar la cuenta', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };
  
  // Cancelar eliminación
  const cancelDelete = () => {
    setConfirmDelete(null);
  };
  
  // Crear nueva cuenta
  const handleCrearCuenta = () => {
    setEditingCuenta(null);
    setShowForm(true);
    setSelectedCuenta(null);
    
    if (mobileView && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Gestionar pago de cuenta
  const handlePago = async (cuentaId) => {
    try {
      // Actualizar el estado de la cuenta en la base de datos
      await db.cuentas.update(cuentaId, { estaPagada: true });

      // Actualizar el estado local
      setCuentas((prevCuentas) =>
        prevCuentas.map((cuenta) =>
          cuenta.id === cuentaId ? { ...cuenta, estaPagada: true } : cuenta
        )
      );

      // Refrescar datos y estadísticas
      await cargarCuentas(); // Recargar la lista de cuentas
      fetchData();
      showNotification('Cuenta marcada como pagada correctamente');
    } catch (error) {
      console.error('Error al marcar la cuenta como pagada:', error);
      showNotification('Error al marcar la cuenta como pagada', 'error');
    }
  };
  
  // Formatear fecha
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-CL');
  };
  
  // Formatear monto (CORREGIDO: de COP a CLP)
  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };
  
  // Verificar si una cuenta está próxima a vencer
  const isProximaVencer = (cuenta) => {
    if (!cuenta.fechaVencimiento || cuenta.estaPagada) return false;
    
    const hoy = new Date();
    const enDiezDias = new Date();
    enDiezDias.setDate(hoy.getDate() + 10);
    const fechaVencimiento = new Date(cuenta.fechaVencimiento);
    
    return fechaVencimiento >= hoy && fechaVencimiento <= enDiezDias;
  };
  
  // Renderizar tarjeta de cuenta
  const renderCuentaCard = (cuenta) => {
    const esProxima = isProximaVencer(cuenta);
    const categoriaClass = cuenta.categoria ? getCategoryClass(cuenta.categoria) : '';
    const cardClasses = [
      'cuenta-card',
      categoriaClass,
    ];
    
    return (
      <div 
        key={cuenta.id} 
        className={cardClasses.join(' ')} 
        onClick={() => handleSelectCuenta(cuenta)}
      >
        <div className="cuenta-content">
          <div className="cuenta-header">
            <h3 className="cuenta-titulo">{cuenta.nombre}</h3>
            <div className="badge-container">
              {cuenta.categoria && (
                <span className={`badge ${getCategoryClass(cuenta.categoria)}`}>
                  {cuenta.categoria}
                </span>
              )}
              {esProxima && (
                <span className="badge urgente">Próxima a vencer</span>
              )}
            </div>
          </div>
          
          <div className="cuenta-body">
            <div className="cuenta-info">
              {cuenta.proveedor && (
                <div className="info-item">
                  <span className="info-label">Proveedor:</span>
                  <span className="info-value">{cuenta.proveedor}</span>
                </div>
              )}
              
              <div className="info-item amount">
                <span className="info-label">Monto:</span>
                <span className="info-value">{formatMonto(cuenta.monto)}</span>
              </div>
              
              {cuenta.fechaVencimiento && (
                <div className="info-item">
                  <span className="info-label">Vencimiento:</span>
                  <span className={`info-value ${esProxima ? 'proxima' : ''}`}>
                    {formatFecha(cuenta.fechaVencimiento)}
                    {esProxima && <span className="aviso-proxima">¡Próxima!</span>}
                  </span>
                </div>
              )}
              
              <div className="info-item">
                <span className="info-label">Estado:</span>
                <span className={`info-value ${cuenta.estaPagada ? 'pagada' : 'pendiente'}`}>
                  {cuenta.estaPagada ? 'Pagada' : 'Pendiente'}
                </span>
              </div>
            </div>
            
            <div className="cuenta-actions">
              {!cuenta.estaPagada && (
                <button 
                  className="pagar-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePago(cuenta.id);
                  }}
                  aria-label="Marcar como pagada"
                >
                  Marcar como Pagada
                </button>
              )}
              <button 
                className="edit-button" 
                onClick={(e) => handleEditCuenta(e, cuenta)}
                aria-label="Editar cuenta"
              >
                <span className="edit-icon">✏️</span>
              </button>
              <button 
                className="delete-button" 
                onClick={(e) => handleDeleteClick(e, cuenta)}
                aria-label="Eliminar cuenta"
              >
                <span className="delete-icon">🗑️</span>
              </button>
            </div>
          </div>
        </div>
        
        {cuenta.rutaFactura && (
          <div 
            className="cuenta-has-factura" 
            onClick={(e) => handleViewFactura(e, cuenta)}
          >
            <span className="factura-indicator">📄</span>
            <span className="factura-tooltip">Ver factura</span>
          </div>
        )}
      </div>
    );
  };
  
  // Renderizar detalles de cuenta
  const renderCuentaDetails = () => {
    if (!selectedCuenta) return null;
    
    return (
      <div className="side-panel">
        <div className="panel-header">
          <h3>{viewingFactura ? 'Factura' : 'Detalles de la Cuenta'}</h3>
          <button 
            className="close-panel" 
            onClick={handleCloseDetails}
            aria-label="Cerrar panel"
          >
            ×
          </button>
        </div>
        
        <div className="panel-content">
          {viewingFactura ? (
            <FileViewer filePath={selectedCuenta.rutaFactura} />
          ) : (
            <>
              <div className="details-section">
                <div className="detail-header">
                  <h2>{selectedCuenta.nombre}</h2>
                  {selectedCuenta.categoria && (
                    <span className={`badge large ${getCategoryClass(selectedCuenta.categoria)}`}>
                      {selectedCuenta.categoria}
                    </span>
                  )}
                </div>
                
                <div className="detail-row highlight">
                  <span className="detail-label">Monto</span>
                  <span className="detail-value">{formatMonto(selectedCuenta.monto)}</span>
                </div>
              </div>
              
              <div className="details-section">
                <h4>Información General</h4>
                
                {selectedCuenta.proveedor && (
                  <div className="detail-row">
                    <span className="detail-label">Proveedor</span>
                    <span className="detail-value">{selectedCuenta.proveedor}</span>
                  </div>
                )}
                
                {selectedCuenta.fechaVencimiento && (
                  <div className="detail-row">
                    <span className="detail-label">Fecha de Vencimiento</span>
                    <span className="detail-value">
                      {formatFecha(selectedCuenta.fechaVencimiento)}
                      {isProximaVencer(selectedCuenta) && (
                        <span className="aviso-detalle-proxima"> ¡Próxima a vencer!</span>
                      )}
                    </span>
                  </div>
                )}
                
                <div className="detail-row">
                  <span className="detail-label">Fecha de Creación</span>
                  <span className="detail-value">{formatFecha(selectedCuenta.fechaCreacion)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Estado</span>
                  <span className={`detail-value ${selectedCuenta.estaPagada ? 'pagada' : 'pendiente'}`}>
                    {selectedCuenta.estaPagada ? 'Pagada' : 'Pendiente'}
                  </span>
                </div>
              </div>
              
              {selectedCuenta.descripcion && (
                <div className="details-section">
                  <h4>Descripción</h4>
                  <p className="description-text">{selectedCuenta.descripcion}</p>
                </div>
              )}
              
              {selectedCuenta.rutaFactura && (
                <div className="details-section">
                  <h4>Factura</h4>
                  <div className="factura-info">
                    <span className="factura-icon">📄</span>
                    <span>Factura disponible para esta cuenta</span>
                  </div>
                  <button 
                    className="ver-factura-button"
                    onClick={() => setViewingFactura(true)}
                  >
                    Ver Factura
                  </button>
                </div>
              )}
              
              <div className="detail-actions">
                <button 
                  className="action-button edit"
                  onClick={() => {
                    setEditingCuenta(selectedCuenta);
                    setShowForm(true);
                    setSelectedCuenta(null);
                  }}
                >
                  <span className="action-icon">✏️</span> Editar Cuenta
                </button>
                
                <button 
                  className="action-button delete"
                  onClick={() => setConfirmDelete(selectedCuenta)}
                >
                  <span className="action-icon">🗑️</span> Eliminar Cuenta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="gestion-page">
      <NavBar />
      
      <div className="gestion-container">
        <div className="gestion-header">
          <h2>Gestión de Cuentas</h2>
          <button 
            className="crear-cuenta-button" 
            onClick={handleCrearCuenta}
          >
            <span className="icon">+</span> Crear Cuenta
          </button>
        </div>
        
        <div className={`stats-container ${statsVisible ? 'visible' : ''}`}>
          <div className="stat-card total-cuentas">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalCuentas}</div>
              <div className="stat-label">Total de Cuentas</div>
            </div>
          </div>
          
          <div className="stat-card pendientes">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.pendientes}</div>
              <div className="stat-label">Cuentas Pendientes</div>
            </div>
          </div>
          
          <div className="stat-card monto-total">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{formatMonto(stats.montoTotal)}</div>
              <div className="stat-label">Monto Total</div>
            </div>
          </div>
          
          <div className="stat-card proximas-vencer">
            <div className="stat-icon">🔔</div>
            <div className="stat-content">
              <div className="stat-value">{stats.proximasVencer}</div>
              <div className="stat-label">Próximas a Vencer</div>
            </div>
          </div>
        </div>
        
        <div className="filter-bar-container">
          <div className="filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar cuenta por nombre o proveedor..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
                ref={searchInputRef}
              />
              {searchTerm && (
                <button className="clear-search" onClick={clearSearch} aria-label="Limpiar búsqueda">
                  ✕
                </button>
              )}
            </div>
            
            <div className="filter-controls">
              <div className="sort-control">
                <label htmlFor="sort-select">Ordenar por:</label>
                <select 
                  id="sort-select"
                  value={sortBy}
                  onChange={handleSortChange}
                  className="sort-select"
                >
                  <option value="fecha">Fecha de creación</option>
                  <option value="nombre">Nombre</option>
                  <option value="monto">Monto</option>
                  <option value="vencimiento">Fecha de vencimiento</option>
                </select>
                <button 
                  onClick={handleSortDirectionChange}
                  className="toggle-categories-button"
                  aria-label={`Ordenar ${sortDirection === 'asc' ? 'descendente' : 'ascendente'}`}
                >
                  ↕️ {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                </button>
              </div>
              
              <button 
                className="toggle-categories-button" 
                onClick={() => setShowCategorias(!showCategorias)}
              >
                {showCategorias ? 'Ocultar Categorías' : 'Mostrar Categorías'}
              </button>
            </div>
            
            {showCategorias && (
              <div className="category-tabs">
                <button
                  className={`category-tab ${categoriaSeleccionada === 'todas' ? 'active' : ''}`}
                  onClick={() => handleCategoriaChange('todas')}
                >
                  Todas
                </button>
                {categorias.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-tab ${categoriaSeleccionada === cat.nombre ? 'active' : ''}`}
                    onClick={() => handleCategoriaChange(cat.nombre)}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div ref={contentRef} className={`gestion-content ${(showForm || selectedCuenta) ? 'with-side-panel' : ''} ${mobileView ? 'mobile-view' : ''}`}>
          <div className={`cuentas-grid ${showForm && mobileView ? 'hidden' : ''}`}>
            {loading ? (
              <div className="loading-indicator">
                <div className="loading-content">
                  <div className="spinner"></div>
                  <p>Cargando cuentas...</p>
                </div>
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-icon">⚠️</div>
                <h3>Error al cargar cuentas</h3>
                <p>{error}</p>
                <div className="empty-state-actions">
                  <button className="action-button" onClick={fetchData}>
                    Intentar de nuevo
                  </button>
                </div>
              </div>
            ) : cuentasFiltradas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No se encontraron cuentas</h3>
                <p>
                  {searchTerm 
                    ? 'No hay resultados para tu búsqueda. Intenta con otros términos.' 
                    : categoriaSeleccionada !== 'todas' 
                      ? `No hay cuentas en la categoría "${categoriaSeleccionada}".` 
                      : 'No tienes cuentas creadas. ¡Crea tu primera cuenta!'}
                </p>
                <div className="empty-state-actions">
                  {searchTerm && (
                    <button className="action-button secondary" onClick={clearSearch}>
                      Limpiar búsqueda
                    </button>
                  )}
                  <button className="crear-cuenta-button-empty" onClick={handleCrearCuenta}>
                    <span className="icon">+</span> Crear Nueva Cuenta
                  </button>
                </div>
              </div>
            ) : (
              cuentasFiltradas.map(cuenta => renderCuentaCard(cuenta))
            )}
          </div>
          
          {showForm && (
            <div className={`side-panel form-panel ${mobileView ? 'mobile' : ''}`}>
              <div className="panel-header">
                <h3>{editingCuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}</h3>
                <button 
                  className="close-panel" 
                  onClick={handleCloseForm}
                  aria-label="Cerrar formulario"
                >
                  ×
                </button>
              </div>
              <div className="panel-content">
                <CuentaForm 
                  cuenta={editingCuenta}
                  categorias={categorias}
                  onSave={handleSaveCuenta}
                  onCancel={handleCloseForm}
                />
              </div>
            </div>
          )}
          
          {selectedCuenta && !showForm && renderCuentaDetails()}
        </div>
        
        {/* Botón flotante para volver en móvil */}
        {mobileView && (selectedCuenta || showForm) && (
          <button 
            className="floating-back-button"
            onClick={selectedCuenta ? handleCloseDetails : handleCloseForm}
          >
            ← Volver
          </button>
        )}
        
        {/* Notificaciones */}
        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        
        {/* Modal de confirmación */}
        {confirmDelete && (
          <div className="confirmation-modal">
            <div className="confirmation-content">
              <h3>Confirmar eliminación</h3>
              <p>¿Estás seguro de eliminar la cuenta "{confirmDelete.nombre}"?</p>
              <div className="modal-warning">Esta acción no se puede deshacer.</div>
              <div className="modal-actions">
                <button className="modal-button cancel" onClick={cancelDelete}>
                  Cancelar
                </button>
                <button className="modal-button confirm" onClick={confirmDeleteCuenta}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionCuentas;
