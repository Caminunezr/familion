import React, { useState, useEffect, useCallback, useRef } from 'react';
import NavBar from './NavBar';
import CuentaForm from './CuentaForm';
import FileViewer from './FileViewer';
import db from '../utils/database';
import { useAuth } from '../contexts/AuthContext';
import './GestionCuentas.css';

const GestionCuentas = () => {
  const { currentUser } = useAuth(); // Usamos currentUser directamente
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCuenta, setEditingCuenta] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('todas');
  const [showForm, setShowForm] = useState(false);
  const [showDetailsCard, setShowDetailsCard] = useState(null);
  const [notification, setNotification] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);
  const [expandedCategories, setExpandedCategories] = useState(true);
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalCuentas: 0,
    pendientesPago: 0,
    totalMonto: 0,
    proximasVencer: 0
  });
  const [visibleStats, setVisibleStats] = useState(false);
  
  const contentRef = useRef(null);
  const searchInputRef = useRef(null);

  // Función reutilizable para obtener cuentas de la base de datos
  const fetchCuentas = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener todas las cuentas
      const cuentasArray = await db.cuentas.toArray();
      
      // Extraer todas las categorías para usar en filtros
      const categorias = [...new Set(cuentasArray
        .map(cuenta => cuenta.categoria)
        .filter(Boolean))];
      
      setAllCategories(categorias);
      setCuentas(cuentasArray);
      
      // Cargar también los pagos para calcular estadísticas
      const pagosArray = await db.pagos.toArray();
      
      // Procesar estadísticas
      const today = new Date();
      const proximasSemana = new Date();
      proximasSemana.setDate(today.getDate() + 7);
      
      const pagadas = new Set(
        pagosArray.reduce((acc, pago) => {
          const cuentaId = pago.cuentaId;
          const cuenta = cuentasArray.find(c => c.id === cuentaId);
          
          if (cuenta && pago.montoPagado >= cuenta.monto) {
            acc.push(cuentaId);
          }
          return acc;
        }, [])
      );
      
      const stats = {
        totalCuentas: cuentasArray.length,
        pendientesPago: cuentasArray.length - pagadas.size,
        totalMonto: cuentasArray.reduce((sum, cuenta) => sum + cuenta.monto, 0),
        proximasVencer: cuentasArray.filter(cuenta => {
          if (!cuenta.fechaVencimiento) return false;
          const fechaVencimiento = new Date(cuenta.fechaVencimiento);
          return !pagadas.has(cuenta.id) && 
                  fechaVencimiento >= today && 
                  fechaVencimiento <= proximasSemana;
        }).length
      };
      
      setDashboardStats(stats);
      
      return cuentasArray;
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      showNotification('Error al cargar los datos', 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto inicial para cargar y ordenar datos
  useEffect(() => {
    const loadAndSortData = async () => {
      const cuentasArray = await fetchCuentas();
      sortCuentas(cuentasArray, sortOrder);
      
      // Mostrar estadísticas después de 300ms para una mejor experiencia visual
      setTimeout(() => setVisibleStats(true), 300);
    };
    
    loadAndSortData();
    
    // Listener para el tamaño de la ventana
    const handleResize = () => {
      setMobileView(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchCuentas, refreshKey, sortOrder]);

  // Función para mostrar notificaciones de manera centralizada
  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ message, type });
    if (duration) {
      setTimeout(() => setNotification(null), duration);
    }
  };

  // Función para ordenar cuentas
  const sortCuentas = (cuentasToSort, order) => {
    let sortedCuentas = [...cuentasToSort];
    
    switch (order) {
      case 'date-asc':
        sortedCuentas.sort((a, b) => new Date(a.fechaCreacion) - new Date(b.fechaCreacion));
        break;
      case 'date-desc':
        sortedCuentas.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        break;
      case 'name-asc':
        sortedCuentas.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'name-desc':
        sortedCuentas.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'amount-asc':
        sortedCuentas.sort((a, b) => a.monto - b.monto);
        break;
      case 'amount-desc':
        sortedCuentas.sort((a, b) => b.monto - a.monto);
        break;
      case 'due-date':
        sortedCuentas.sort((a, b) => {
          // Si no tiene fecha, va al final
          if (!a.fechaVencimiento) return 1;
          if (!b.fechaVencimiento) return -1;
          return new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento);
        });
        break;
      default:
        sortedCuentas.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    }
    
    setCuentas(sortedCuentas);
  };

  // Handler para cuando una cuenta es creada o actualizada exitosamente
  const handleCuentaSuccess = (accion, cuentaData) => {
    setEditingCuenta(null);
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
    
    // Mostrar notificación
    showNotification(
      accion === 'create' 
        ? `Cuenta "${cuentaData.nombre}" creada exitosamente` 
        : `Cuenta "${cuentaData.nombre}" actualizada exitosamente`
    );
  };

  // Handler para eliminación de cuenta con nueva confirmación
  const handleDeleteRequest = useCallback((id, nombre, event) => {
    if (event) event.stopPropagation();
    setConfirmDelete({ id, nombre });
  }, []);

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      // Eliminar primero los pagos asociados a esta cuenta
      await db.pagos.where('cuentaId').equals(confirmDelete.id).delete();
      
      // Buscar aportes relacionados con pagos de esta cuenta
      const aportesRelacionados = await db.aportes
        .where('cuentaId')
        .equals(confirmDelete.id)
        .toArray();
      
      // Eliminar aportes relacionados
      for (const aporte of aportesRelacionados) {
        await db.aportes.delete(aporte.id);
      }
      
      // Eliminar la cuenta
      await db.cuentas.delete(confirmDelete.id);
      
      // Mostrar notificación
      showNotification(`Cuenta "${confirmDelete.nombre}" eliminada exitosamente`);
      
      // Refrescar la lista y reiniciar estados
      setRefreshKey(prev => prev + 1);
      setShowDetailsCard(null);
      setConfirmDelete(null);
      
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error);
      showNotification('Error al eliminar la cuenta. Inténtalo de nuevo.', 'error');
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  // Handlers para edición y visualización
  const handleEditCuenta = useCallback((cuenta, event) => {
    if (event) event.stopPropagation();
    setEditingCuenta(cuenta);
    setShowForm(true);
    setShowDetailsCard(null);
    setShowFileViewer(false);
    
    // En móvil, scroll al principio
    if (mobileView && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [mobileView]);

  const handleCrearCuenta = useCallback(() => {
    setEditingCuenta(null);
    setShowForm(true);
    setShowDetailsCard(null);
    setShowFileViewer(false);
    
    // En móvil, scroll al principio
    if (mobileView && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [mobileView]);

  const handleCancelForm = () => {
    setEditingCuenta(null);
    setShowForm(false);
  };

  const handleShowDetails = useCallback((cuenta) => {
    setShowDetailsCard(cuenta);
    setShowForm(false);
    setShowFileViewer(false);
    
    // En móvil, scroll al principio
    if (mobileView && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [mobileView]);

  const handleBackFromDetails = () => {
    setShowDetailsCard(null);
  };
  
  // Ver factura o comprobante
  const handleViewFile = useCallback((filePath, event) => {
    if (event) event.stopPropagation();
    setCurrentFilePath(filePath);
    setShowFileViewer(true);
  }, []);

  // Nuevo handler para limpiar búsqueda y enfocar
  const handleClearSearch = () => {
    setFilter('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Obtener estado de pago para una cuenta específica
  const obtenerEstadoPago = useCallback(async (cuentaId) => {
    try {
      const pagos = await db.pagos.where('cuentaId').equals(cuentaId).toArray();
      const totalPagado = pagos.reduce((sum, pago) => sum + pago.montoPagado, 0);
      const cuenta = cuentas.find(c => c.id === cuentaId);
      
      if (!cuenta) return { pagada: false, monto: 0, pagado: 0 };
      
      return {
        pagada: totalPagado >= cuenta.monto,
        monto: cuenta.monto,
        pagado: totalPagado
      };
    } catch (error) {
      console.error('Error al obtener estado de pago:', error);
      return { pagada: false, monto: 0, pagado: 0 };
    }
  }, [cuentas]);

  // Formatear fechas
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES');
  };

  // Formatear montos
  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  // Determinar clase de categoría para estilos
  const getCategoriaClase = (categoria) => {
    return categoria ? `categoria-${categoria}` : 'categoria-otros';
  };

  // Determinar si una cuenta está próxima a vencer
  const esProximaVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = Math.floor((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    
    return diasRestantes >= 0 && diasRestantes <= 7;
  };

  // Filtrar cuentas por texto y categoría
  const filteredCuentas = cuentas.filter(cuenta => {
    // Filtro de texto
    const matchesText = filter === '' || 
      cuenta.nombre.toLowerCase().includes(filter.toLowerCase()) ||
      (cuenta.proveedor && cuenta.proveedor.toLowerCase().includes(filter.toLowerCase())) ||
      (cuenta.categoria && cuenta.categoria.toLowerCase().includes(filter.toLowerCase())) ||
      (cuenta.descripcion && cuenta.descripcion.toLowerCase().includes(filter.toLowerCase()));
    
    // Filtro de categoría
    if (activeTab === 'todas') return matchesText;
    return cuenta.categoria === activeTab && matchesText;
  });

  // Renderizar mensaje cuando no hay resultados específicos
  const renderNoResultsMessage = () => {
    if (filter && activeTab !== 'todas') {
      return (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No se encontraron resultados</h3>
          <p>No hay cuentas de categoría "{activeTab}" que coincidan con "{filter}"</p>
          <div className="empty-state-actions">
            <button 
              className="action-button"
              onClick={() => setActiveTab('todas')}
            >
              Ver todas las categorías
            </button>
            <button 
              className="action-button secondary"
              onClick={handleClearSearch}
            >
              Limpiar búsqueda
            </button>
          </div>
        </div>
      );
    } 
    
    if (filter) {
      return (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No se encontraron resultados</h3>
          <p>No hay cuentas que coincidan con "{filter}"</p>
          <button 
            className="action-button"
            onClick={handleClearSearch}
          >
            Limpiar búsqueda
          </button>
        </div>
      );
    }
    
    if (activeTab !== 'todas') {
      return (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No hay cuentas en esta categoría</h3>
          <p>No se encontraron cuentas en la categoría "{activeTab}"</p>
          <button 
            className="action-button"
            onClick={() => setActiveTab('todas')}
          >
            Ver todas las categorías
          </button>
        </div>
      );
    }
    
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No hay cuentas registradas</h3>
        <p>Crea tu primera cuenta para comenzar a gestionar tus pagos familiares</p>
        <button 
          className="crear-cuenta-button-empty"
          onClick={handleCrearCuenta}
        >
          Crear Primera Cuenta
        </button>
      </div>
    );
  };

  // Renderizar las tarjetas de estadísticas
  const renderStatCards = () => (
    <div className={`stats-container ${visibleStats ? 'visible' : ''}`}>
      <div className="stat-card total-cuentas">
        <div className="stat-icon">📊</div>
        <div className="stat-content">
          <div className="stat-value">{dashboardStats.totalCuentas}</div>
          <div className="stat-label">Total de Cuentas</div>
        </div>
      </div>
      
      <div className="stat-card pendientes">
        <div className="stat-icon">⏳</div>
        <div className="stat-content">
          <div className="stat-value">{dashboardStats.pendientesPago}</div>
          <div className="stat-label">Pendientes de Pago</div>
        </div>
      </div>
      
      <div className="stat-card monto-total">
        <div className="stat-icon">💰</div>
        <div className="stat-content">
          <div className="stat-value">{formatMonto(dashboardStats.totalMonto)}</div>
          <div className="stat-label">Monto Total</div>
        </div>
      </div>
      
      <div className="stat-card proximas-vencer">
        <div className="stat-icon">⚠️</div>
        <div className="stat-content">
          <div className="stat-value">{dashboardStats.proximasVencer}</div>
          <div className="stat-label">Próximas a Vencer (7 días)</div>
        </div>
      </div>
    </div>
  );

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
            <i className="icon">+</i> Crear Cuenta
          </button>
        </div>
        
        {/* Stats dashboard */}
        {!showForm && !showDetailsCard && !showFileViewer && renderStatCards()}
        
        <div className="filter-bar-container">
          <div className="filter-bar">
            <div className="search-box">
              <i className="search-icon">🔍</i>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por nombre, proveedor o descripción..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="search-input"
              />
              {filter && (
                <button 
                  className="clear-search" 
                  onClick={handleClearSearch}
                  aria-label="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="filter-controls">
              <div className="sort-control">
                <label htmlFor="sort-select">Ordenar por:</label>
                <select 
                  id="sort-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="sort-select"
                >
                  <option value="date-desc">Más recientes</option>
                  <option value="date-asc">Más antiguas</option>
                  <option value="name-asc">Nombre (A-Z)</option>
                  <option value="name-desc">Nombre (Z-A)</option>
                  <option value="amount-desc">Mayor monto</option>
                  <option value="amount-asc">Menor monto</option>
                  <option value="due-date">Fecha de vencimiento</option>
                </select>
              </div>
              
              <button 
                className="toggle-categories-button"
                onClick={() => setExpandedCategories(!expandedCategories)}
              >
                {expandedCategories ? 'Ocultar categorías' : 'Mostrar categorías'}
              </button>
            </div>
          </div>
          
          {expandedCategories && (
            <div className="category-tabs">
              <button 
                className={`category-tab ${activeTab === 'todas' ? 'active' : ''}`}
                onClick={() => setActiveTab('todas')}
              >
                Todas
              </button>
              {allCategories.map(categoria => (
                <button 
                  key={categoria}
                  className={`category-tab ${activeTab === categoria ? 'active' : ''}`}
                  onClick={() => setActiveTab(categoria)}
                >
                  {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div 
          ref={contentRef}
          className={`gestion-content ${
            (showForm || showDetailsCard || showFileViewer) ? 'with-side-panel' : ''
          } ${mobileView ? 'mobile-view' : ''}`}
        >
          <div className={`cuentas-grid ${showFileViewer ? 'hidden' : ''}`}>
            {loading ? (
              <div className="loading-indicator">
                <div className="loading-content">
                  <div className="spinner"></div>
                  <p>Cargando cuentas...</p>
                </div>
              </div>
            ) : filteredCuentas.length === 0 ? (
              renderNoResultsMessage()
            ) : (
              <>
                {filteredCuentas.map(cuenta => (
                  <div 
                    key={cuenta.id} 
                    className={`cuenta-card 
                      ${editingCuenta?.id === cuenta.id ? 'editing' : ''} 
                      ${showDetailsCard?.id === cuenta.id ? 'selected' : ''} 
                      ${esProximaVencer(cuenta.fechaVencimiento) ? 'proxima-vencer' : ''} 
                      ${cuenta.categoria ? 'category-' + cuenta.categoria : 'category-otros'}`}
                    onClick={() => handleShowDetails(cuenta)}
                  >
                    <div className="cuenta-content">
                      <div className="cuenta-header">
                        <h3 className="cuenta-titulo">{cuenta.nombre}</h3>
                        <div className="badge-container">
                          {cuenta.categoria && (
                            <span className={`badge ${getCategoriaClase(cuenta.categoria)}`}>
                              {cuenta.categoria}
                            </span>
                          )}
                          {esProximaVencer(cuenta.fechaVencimiento) && (
                            <span className="badge urgente">
                              Próximo vencimiento
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="cuenta-body">
                        <div className="cuenta-info">
                          <div className="info-item">
                            <span className="info-label">Proveedor</span>
                            <span className="info-value">{cuenta.proveedor || 'No especificado'}</span>
                          </div>
                          <div className="info-item amount">
                            <span className="info-label">Monto</span>
                            <span className="info-value monto">{formatMonto(cuenta.monto)}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Vencimiento</span>
                            <span className={`info-value ${esProximaVencer(cuenta.fechaVencimiento) ? 'proxima' : ''}`}>
                              {formatFecha(cuenta.fechaVencimiento)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="cuenta-actions">
                        <button 
                          className="edit-button"
                          onClick={(e) => handleEditCuenta(cuenta, e)}
                          aria-label="Editar cuenta"
                        >
                          <i className="edit-icon">✏️</i>
                        </button>
                        <button 
                          className="delete-button"
                          onClick={(e) => handleDeleteRequest(cuenta.id, cuenta.nombre, e)}
                          aria-label="Eliminar cuenta"
                        >
                          <i className="delete-icon">🗑️</i>
                        </button>
                      </div>
                      
                      {cuenta.rutaFactura && (
                        <div 
                          className="cuenta-has-factura"
                          onClick={(e) => handleViewFile(cuenta.rutaFactura, e)}
                        >
                          <span className="factura-indicator">📄</span>
                          <span className="factura-tooltip">Ver factura</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          
          {showForm && (
            <div className={`side-panel form-panel ${mobileView ? 'mobile' : ''}`}>
              <div className="panel-header">
                <h3>{editingCuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}</h3>
                <button 
                  className="close-panel"
                  onClick={handleCancelForm}
                  aria-label="Cerrar panel"
                >
                  ×
                </button>
              </div>
              <div className="panel-content">
                <CuentaForm 
                  cuentaToEdit={editingCuenta}
                  onSuccess={handleCuentaSuccess}
                  onCancel={handleCancelForm}
                  categorias={allCategories}
                />
              </div>
            </div>
          )}
          
          {showDetailsCard && (
            <div className={`side-panel details-panel ${mobileView ? 'mobile' : ''}`}>
              <div className="panel-header">
                <h3>Detalles de la Cuenta</h3>
                <button 
                  className="close-panel"
                  onClick={handleBackFromDetails}
                  aria-label="Cerrar panel"
                >
                  ×
                </button>
              </div>
              <div className="panel-content">
                <div className="detail-header">
                  <h2>{showDetailsCard.nombre}</h2>
                  {showDetailsCard.categoria && (
                    <span className={`badge large ${getCategoriaClase(showDetailsCard.categoria)}`}>
                      {showDetailsCard.categoria}
                    </span>
                  )}
                </div>
                
                <div className="details-section">
                  <div className="detail-row">
                    <span className="detail-label">Proveedor</span>
                    <span className="detail-value">{showDetailsCard.proveedor || 'No especificado'}</span>
                  </div>
                  <div className="detail-row highlight">
                    <span className="detail-label">Monto</span>
                    <span className="detail-value">{formatMonto(showDetailsCard.monto)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Fecha de vencimiento</span>
                    <span className={`detail-value ${esProximaVencer(showDetailsCard.fechaVencimiento) ? 'proxima' : ''}`}>
                      {formatFecha(showDetailsCard.fechaVencimiento)}
                      {esProximaVencer(showDetailsCard.fechaVencimiento) && 
                        <span className="aviso-detalle-proxima"> (¡Próxima a vencer!)</span>
                      }
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Fecha de creación</span>
                    <span className="detail-value">{formatFecha(showDetailsCard.fechaCreacion)}</span>
                  </div>
                </div>
                
                {showDetailsCard.descripcion && (
                  <div className="details-section">
                    <h4>Descripción</h4>
                    <p className="description-text">{showDetailsCard.descripcion}</p>
                  </div>
                )}
                
                {showDetailsCard.rutaFactura && (
                  <div className="details-section factura-section">
                    <h4>Factura adjunta</h4>
                    <div className="factura-info">
                      <span className="factura-icon">📄</span>
                      <span>Esta cuenta tiene una factura adjunta</span>
                    </div>
                    <button 
                      className="ver-factura-button"
                      onClick={() => handleViewFile(showDetailsCard.rutaFactura)}
                    >
                      Ver factura
                    </button>
                  </div>
                )}
                
                <div className="detail-actions">
                  <button 
                    className="action-button edit"
                    onClick={(e) => handleEditCuenta(showDetailsCard, e)}
                  >
                    <i className="action-icon">✏️</i> Editar cuenta
                  </button>
                  <button 
                    className="action-button delete"
                    onClick={(e) => handleDeleteRequest(showDetailsCard.id, showDetailsCard.nombre, e)}
                  >
                    <i className="action-icon">🗑️</i> Eliminar cuenta
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {showFileViewer && (
            <div className={`side-panel file-viewer-panel ${mobileView ? 'mobile' : ''}`}>
              <div className="panel-header">
                <h3>Vista de Documento</h3>
                <button 
                  className="close-panel"
                  onClick={() => setShowFileViewer(false)}
                  aria-label="Cerrar visor"
                >
                  ×
                </button>
              </div>
              <div className="panel-content">
                <FileViewer filePath={currentFilePath} />
              </div>
            </div>
          )}
        </div>
        
        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        
        {confirmDelete && (
          <div className="confirmation-modal">
            <div className="confirmation-content">
              <h3>¿Eliminar cuenta?</h3>
              <p>¿Estás seguro de que deseas eliminar la cuenta <strong>"{confirmDelete.nombre}"</strong>?</p>
              <p className="modal-warning">Esta acción no se puede deshacer y eliminará todos los pagos asociados.</p>
              <div className="modal-actions">
                <button 
                  className="modal-button cancel"
                  onClick={handleCancelDelete}
                >
                  Cancelar
                </button>
                <button 
                  className="modal-button confirm"
                  onClick={handleConfirmDelete}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {mobileView && (showForm || showDetailsCard || showFileViewer) && (
          <button 
            className="floating-back-button"
            onClick={() => {
              if (showForm) handleCancelForm();
              else if (showDetailsCard) handleBackFromDetails();
              else if (showFileViewer) setShowFileViewer(false);
            }}
          >
            ← Volver a la lista
          </button>
        )}
      </div>
    </div>
  );
};

export default GestionCuentas;
