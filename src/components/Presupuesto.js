import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NavBar from './NavBar';
import { useAuth } from '../contexts/AuthContext';
import db, { resetDatabase } from '../utils/database';
import { saveFile } from '../utils/fileStorage';
import FileViewer from './FileViewer';
import './Presupuesto.css';
import { migratePresupuestos } from '../utils/dataMigration';

// Componente para renderizar la tarjeta de un presupuesto
const PresupuestoCard = React.memo(({ presupuesto, onClick, formatoMes }) => (
  <div className="presupuesto-card" onClick={() => onClick(presupuesto)}>
    <div className="presupuesto-mes">{formatoMes(presupuesto.mes)}</div>
    <div className="presupuesto-monto">
      <span>Aporte:</span>
      <span className="monto-value">
        ${(presupuesto.montoAporte || presupuesto.montoObjetivo).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      </span>
    </div>
    <div className="presupuesto-fecha">
      Creado el {new Date(presupuesto.fechaCreacion).toLocaleDateString('es-ES')}
    </div>
    <div className="presupuesto-creador">
      <span className="creador-label">Por:</span>
      <span className="creador-value">
        {presupuesto.creadorNombre || 'Usuario'}
      </span>
    </div>
  </div>
));

// Componente para renderizar un aporte
const AporteItem = React.memo(({ aporte, getNombreUsuario, mostrarComprobante, toggleComprobante }) => (
  <div key={aporte.id} className={`aporte-card ${aporte.tipoPago === 'cuenta' ? 'aporte-cuenta' : ''}`}>
    <div className="aporte-type-indicator">
      {aporte.tipoPago === 'cuenta' ? '💸 Pago de cuenta' : '💰 Aporte directo'}
    </div>
    <div className="aporte-info">
      <div className="aporte-monto">
        ${aporte.monto.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      </div>
      <div className="aporte-detalles">
        <div className="aporte-miembro">
          <span className="detalles-label">Miembro:</span>
          <span className="detalles-value">{getNombreUsuario(aporte.miembroId)}</span>
        </div>
        <div className="aporte-fecha">
          <span className="detalles-label">Fecha:</span>
          <span className="detalles-value">{new Date(aporte.fechaAporte).toLocaleDateString('es-ES')}</span>
        </div>
        {aporte.tipoPago === 'cuenta' && (
          <div className="aporte-cuenta-info">
            <span className="detalles-label">Pago de cuenta:</span>
            <span className="detalles-value cuenta-value">{aporte.cuentaNombre}</span>
          </div>
        )}
      </div>
    </div>
    
    {aporte.rutaComprobante && (
      <div className="aporte-comprobante">
        <button 
          className="ver-comprobante-button"
          onClick={() => toggleComprobante(aporte.rutaComprobante)}
        >
          {aporte.rutaComprobante === mostrarComprobante ? 
            <><span className="button-icon">👁️</span> Ocultar</> : 
            <><span className="button-icon">📄</span> Ver Comprobante</>}
        </button>
      </div>
    )}
    
    {mostrarComprobante === aporte.rutaComprobante && (
      <div className="comprobante-viewer">
        <FileViewer filePath={aporte.rutaComprobante} />
      </div>
    )}
  </div>
));

const Presupuesto = () => {
  const { currentUser } = useAuth();
  const [presupuestos, setPresupuestos] = useState({});
  const [selectedPresupuesto, setSelectedPresupuesto] = useState(null);
  const [aportes, setAportes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarFormularioAporte, setMostrarFormularioAporte] = useState(false);
  const [formData, setFormData] = useState({
    mes: new Date().toISOString().slice(0, 7), // YYYY-MM
    montoAporte: '150000', // Valor predeterminado de 150,000
    descripcion: ''
  });
  const [formAporte, setFormAporte] = useState({
    monto: '',
    fechaAporte: new Date().toISOString().split('T')[0]
  });
  const [comprobante, setComprobante] = useState(null);
  const [error, setError] = useState('');
  const [mostrarComprobante, setMostrarComprobante] = useState(null);
  const [dbError, setDbError] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Handler para alternar la visualización de un comprobante
  const toggleComprobante = useCallback((rutaComprobante) => {
    setMostrarComprobante(prevRuta => 
      prevRuta === rutaComprobante ? null : rutaComprobante
    );
  }, []);

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        setLoading(true);
        // Intentar acceder a la tabla presupuestos
        await db.presupuestos.toArray();
        
        // Ejecutar migración
        await migratePresupuestos();
        
        // Si llega aquí, la tabla existe
        fetchData();
      } catch (error) {
        console.error('Error al verificar la base de datos:', error);
        setDbError(true);
        setLoading(false);
      }
    };
    
    const fetchData = async () => {
      try {
        // Obtener presupuestos
        const presupuestosData = await db.presupuestos.toArray();
        
        // Obtener usuarios para mapear IDs a nombres
        // En un entorno real, esto debería cargar todos los usuarios de la familia
        const usuariosArray = [{
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email
        }];
        
        setUsuarios(usuariosArray);
        
        // Agrupar presupuestos por usuario creador
        const presupuestosPorUsuario = {};
        
        presupuestosData.forEach(presupuesto => {
          const creadorId = presupuesto.creadorId || 'desconocido';
          
          if (!presupuestosPorUsuario[creadorId]) {
            presupuestosPorUsuario[creadorId] = [];
          }
          
          presupuestosPorUsuario[creadorId].push(presupuesto);
        });
        
        // Ordenar presupuestos por mes (más reciente primero) dentro de cada grupo de usuario
        Object.keys(presupuestosPorUsuario).forEach(userId => {
          presupuestosPorUsuario[userId].sort((a, b) => {
            // Ordenar por año y mes (formato: YYYY-MM)
            return b.mes.localeCompare(a.mes);
          });
        });
        
        // Establecer los presupuestos agrupados
        setPresupuestos(presupuestosPorUsuario);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    
    checkDatabase();
  }, [currentUser, refreshKey]);

  useEffect(() => {
    const fetchAportes = async () => {
      if (!selectedPresupuesto) return;
      
      try {
        const aportesData = await db.aportes
          .where('presupuestoId')
          .equals(selectedPresupuesto.id)
          .toArray();
        
        // Ordenar por fecha (más reciente primero)
        aportesData.sort((a, b) => new Date(b.fechaAporte) - new Date(a.fechaAporte));
        
        setAportes(aportesData);
      } catch (error) {
        console.error('Error al cargar aportes:', error);
      }
    };
    
    fetchAportes();
  }, [selectedPresupuesto]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleAporteChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormAporte(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  const handleFileChange = useCallback((e) => {
    if (e.target.files.length > 0) {
      setComprobante(e.target.files[0]);
    }
  }, []);

  // Función para eliminar un presupuesto
  const handleDeletePresupuesto = useCallback(async () => {
    if (!selectedPresupuesto) return;
  
    if (window.confirm(`¿Estás seguro de que deseas eliminar el presupuesto de ${formatoMes(selectedPresupuesto.mes)}? Esta acción eliminará también todos los aportes asociados.`)) {
      try {
        // Primero eliminar todos los aportes asociados
        await db.aportes
          .where('presupuestoId')
          .equals(selectedPresupuesto.id)
          .delete();
        
        // Luego eliminar el presupuesto
        await db.presupuestos.delete(selectedPresupuesto.id);
        
        // Actualizar UI y mostrar mensaje
        setSelectedPresupuesto(null);
        setRefreshKey(prev => prev + 1);
        setError('');
      } catch (error) {
        console.error('Error al eliminar presupuesto:', error);
        setError('Error al eliminar el presupuesto');
      }
    }
  }, [selectedPresupuesto]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formData.mes || !formData.montoAporte) {
      setError('El mes y monto de aporte son obligatorios');
      return;
    }
    
    try {
      const presupuestoData = {
        ...formData,
        montoAporte: parseFloat(formData.montoAporte),
        estado: 'activo',
        fechaCreacion: new Date().toISOString(),
        creadorId: currentUser.uid,
        creadorNombre: currentUser.displayName || currentUser.email // Guardar el nombre del creador
      };
      
      await db.presupuestos.add(presupuestoData);
      
      // Resetear el formulario
      setFormData({
        mes: new Date().toISOString().slice(0, 7),
        montoAporte: '150000',
        descripcion: ''
      });
      
      setMostrarFormulario(false);
      setError('');
      setRefreshKey(prev => prev + 1); // Refrescar datos
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      setError('Error al guardar el presupuesto');
    }
  }, [formData, currentUser]);

  const handleAporteSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formAporte.monto || !formAporte.fechaAporte) {
      setError('El monto y la fecha son obligatorios');
      return;
    }
    
    try {
      let rutaComprobante = null;
      
      if (comprobante) {
        rutaComprobante = await saveFile(comprobante, 'comprobantes_aportes');
      }
      
      const aporteData = {
        presupuestoId: selectedPresupuesto.id,
        miembroId: currentUser.uid,
        monto: parseFloat(formAporte.monto),
        fechaAporte: formAporte.fechaAporte,
        rutaComprobante,
        fechaCreacion: new Date().toISOString()
      };
      
      await db.aportes.add(aporteData);
      
      // Resetear el formulario
      setFormAporte({
        monto: '',
        fechaAporte: new Date().toISOString().split('T')[0]
      });
      setComprobante(null);
      setMostrarFormularioAporte(false);
      setError('');
      
      // Actualizar lista de aportes
      const aportesData = await db.aportes
        .where('presupuestoId')
        .equals(selectedPresupuesto.id)
        .toArray();
      
      // Ordenar por fecha (más reciente primero)
      aportesData.sort((a, b) => new Date(b.fechaAporte) - new Date(a.fechaAporte));
      
      setAportes(aportesData);
    } catch (error) {
      console.error('Error al guardar aporte:', error);
      setError('Error al guardar el aporte');
    }
  }, [formAporte, selectedPresupuesto, currentUser, comprobante]);

  const formatoMes = useCallback((mesString) => {
    const [año, mes] = mesString.split('-');
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${nombresMeses[parseInt(mes) - 1]} ${año}`;
  }, []);

  const calcularTotalAportado = useCallback(() => {
    // Si es un presupuesto antiguo, podría tener montoObjetivo en lugar de montoAporte
    if (selectedPresupuesto && !selectedPresupuesto.montoAporte && selectedPresupuesto.montoObjetivo) {
      return selectedPresupuesto.montoObjetivo;
    }
    return aportes.reduce((total, aporte) => total + aporte.monto, 0);
  }, [selectedPresupuesto, aportes]);

  const getNombreUsuario = useCallback((uid) => {
    const usuario = usuarios.find(u => u.uid === uid);
    return usuario ? usuario.displayName : 'Usuario desconocido';
  }, [usuarios]);

  const handleResetDatabase = useCallback(async () => {
    if (window.confirm('¿Estás seguro de que quieres resetear la base de datos? Todos los datos se perderán.')) {
      await resetDatabase();
      window.location.reload();
    }
  }, []);
  
  const handleSelectPresupuesto = useCallback((presupuesto) => {
    setSelectedPresupuesto(presupuesto);
    setMostrarFormularioAporte(false);
    setMostrarComprobante(null);
  }, []);
  
  const handleBackToList = useCallback(() => {
    setSelectedPresupuesto(null);
    setMostrarFormularioAporte(false);
    setMostrarComprobante(null);
  }, []);
  
  const handleBusquedaChange = useCallback((e) => {
    setBusqueda(e.target.value);
  }, []);
  
  // Calcular el progreso como un porcentaje
  const progresoPorcentaje = useMemo(() => {
    if (!selectedPresupuesto) return 0;
    
    const montoObjetivo = selectedPresupuesto.montoAporte || selectedPresupuesto.montoObjetivo;
    const porcentaje = (calcularTotalAportado() / montoObjetivo) * 100;
    return Math.min(porcentaje, 100).toFixed(0);
  }, [selectedPresupuesto, calcularTotalAportado]);
  
  // Lista de presupuestos filtrados por búsqueda
  const presupuestosFiltrados = useMemo(() => {
    if (!busqueda) return presupuestos;
    
    const busquedaLower = busqueda.toLowerCase();
    const resultado = {};
    
    Object.keys(presupuestos).forEach(userId => {
      const presupuestosFiltrados = presupuestos[userId].filter(presupuesto => {
        const nombreMes = formatoMes(presupuesto.mes).toLowerCase();
        return nombreMes.includes(busquedaLower) || 
               presupuesto.descripcion?.toLowerCase().includes(busquedaLower) ||
               presupuesto.creadorNombre?.toLowerCase().includes(busquedaLower);
      });
      
      if (presupuestosFiltrados.length > 0) {
        resultado[userId] = presupuestosFiltrados;
      }
    });
    
    return resultado;
  }, [presupuestos, busqueda, formatoMes]);

  if (dbError) {
    return (
      <div className="presupuesto-page">
        <NavBar />
        <div className="presupuesto-container">
          <div className="db-error-container">
            <div className="error-icon">⚠️</div>
            <h2>Error de Base de Datos</h2>
            <p>Parece que hay un problema con la estructura de la base de datos. Es posible que necesites reiniciarla para aplicar los últimos cambios.</p>
            <button className="reset-db-button" onClick={handleResetDatabase}>
              Reiniciar Base de Datos
            </button>
            <p className="warning-text">Advertencia: Esta acción eliminará todos los datos existentes.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="presupuesto-page">
      <NavBar />
      <div className="presupuesto-container">
        <div className="presupuesto-header">
          <h2>Presupuesto Familiar</h2>
          
          {!mostrarFormulario && !selectedPresupuesto && (
            <div className="header-actions">
              <div className="search-box">
                <input 
                  type="text"
                  placeholder="Buscar presupuesto..." 
                  value={busqueda}
                  onChange={handleBusquedaChange}
                  className="search-input"
                />
                {busqueda && (
                  <button 
                    className="clear-search"
                    onClick={() => setBusqueda('')}
                  >
                    ×
                  </button>
                )}
              </div>
              
              <button 
                className="crear-button"
                onClick={() => setMostrarFormulario(true)}
              >
                <span className="button-icon">+</span> Nuevo Presupuesto
              </button>
            </div>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {mostrarFormulario ? (
          <div className="form-container animate-in">
            <h3>Registrar Aporte Mensual</h3>
            <div className="form-info-box">
              <p><span className="info-icon">💡</span> El aporte mensual aproximado por persona es de $150,000, aunque puede variar según las cuentas que ya hayas pagado directamente.</p>
            </div>
            <form onSubmit={handleSubmit} className="presupuesto-form">
              <div className="form-group">
                <label htmlFor="mes">Mes *</label>
                <input
                  type="month"
                  id="mes"
                  name="mes"
                  value={formData.mes}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="montoAporte">Monto de Aporte Mensual *</label>
                <input
                  type="number"
                  id="montoAporte"
                  name="montoAporte"
                  value={formData.montoAporte}
                  onChange={handleChange}
                  step="0.01"
                  required
                />
                <small className="input-help">El monto estándar es $150,000 pero puede ajustarse según las cuentas ya pagadas.</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="descripcion">Motivo/Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Indique para qué se destinará este aporte (ej: pago de servicios, alimentos, etc.)"
                />
              </div>
              
              <div className="form-buttons">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setMostrarFormulario(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="submit-button">
                  Registrar Presupuesto
                </button>
              </div>
            </form>
          </div>
        ) : selectedPresupuesto ? (
          <div className="presupuesto-detalle animate-in">
            <div className="detalle-header">
              <div className="header-left">
                <button 
                  className="back-button"
                  onClick={handleBackToList}
                >
                  ← Volver
                </button>
              </div>
              <h3>{formatoMes(selectedPresupuesto.mes)}</h3>
              <div className="header-actions">
                <button 
                  className="delete-presupuesto-button"
                  onClick={handleDeletePresupuesto}
                >
                  <span className="delete-icon">🗑️</span> Eliminar
                </button>
              </div>
            </div>
            
            <div className="presupuesto-info-card">
              <div className="card-header">
                <h4>Información del Presupuesto</h4>
              </div>
              <div className="presupuesto-info">
                <div className="info-row">
                  <span className="info-label">Aporte Mensual:</span>
                  <span className="monto-aporte">
                    ${(selectedPresupuesto.montoAporte || selectedPresupuesto.montoObjetivo)
                      .toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Total Aportado:</span>
                  <div className="info-value">
                    <span className="total-aportado">
                      ${calcularTotalAportado().toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </span>
                    <span className="info-tooltip" title="Incluye aportes directos y pagos de cuentas">ⓘ</span>
                  </div>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Creado por:</span>
                  <span className="creador-nombre">{selectedPresupuesto.creadorNombre || 'Usuario'}</span>
                </div>
                
                <div className="progreso-container">
                  <div className="progreso-label">
                    <span>Progreso del Aporte</span>
                    <span className="progreso-porcentaje">{progresoPorcentaje}%</span>
                  </div>
                  <div className="progreso-barra">
                    <div 
                      className="progreso-relleno"
                      style={{ width: `${progresoPorcentaje}%` }}
                    ></div>
                  </div>
                </div>
                
                {selectedPresupuesto.descripcion && (
                  <div className="info-descripcion">
                    <h5>Descripción:</h5>
                    <p>{selectedPresupuesto.descripcion}</p>
                  </div>
                )}
              </div>
            </div>
            
            {mostrarFormularioAporte ? (
              <div className="form-container animate-in">
                <div className="form-header">
                  <h3>Registrar Aporte</h3>
                  <div className="form-info-text">
                    <span className="info-icon">💸</span> Estás registrando un aporte para {formatoMes(selectedPresupuesto.mes)}
                  </div>
                </div>
                <form onSubmit={handleAporteSubmit} className="aporte-form">
                  <div className="form-group">
                    <label htmlFor="monto">Monto Aportado *</label>
                    <div className="currency-input">
                      <span className="currency-symbol">$</span>
                      <input
                        type="number"
                        id="monto"
                        name="monto"
                        value={formAporte.monto}
                        onChange={handleAporteChange}
                        step="0.01"
                        placeholder="150,000"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="fechaAporte">Fecha de Aporte *</label>
                    <input
                      type="date"
                      id="fechaAporte"
                      name="fechaAporte"
                      value={formAporte.fechaAporte}
                      onChange={handleAporteChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="comprobante">Comprobante (opcional)</label>
                    <div className="file-input-container">
                      <input
                        type="file"
                        id="comprobante"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="custom-file-input"
                      />
                      <label htmlFor="comprobante" className="file-input-label">
                        {comprobante ? comprobante.name : 'Seleccionar archivo'}
                      </label>
                    </div>
                    {comprobante && (
                      <div className="file-selected">
                        <span className="file-icon">📄</span>
                        <span className="file-name">{comprobante.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="form-buttons">
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => setMostrarFormularioAporte(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="submit-button">
                      Registrar Aporte
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="aportes-section animate-in">
                <div className="aportes-header">
                  <h3>Aportes Registrados</h3>
                  <button 
                    className="aporte-button"
                    onClick={() => setMostrarFormularioAporte(true)}
                  >
                    <span className="button-icon">+</span> Registrar Aporte
                  </button>
                </div>
                
                {aportes.length === 0 ? (
                  <div className="empty-message">
                    <div className="empty-icon">💰</div>
                    <h4>No hay aportes registrados aún</h4>
                    <p>Registra tu primer aporte para este mes usando el botón de arriba.</p>
                  </div>
                ) : (
                  <div className="aportes-list">
                    {aportes.map(aporte => (
                      <AporteItem
                        key={aporte.id}
                        aporte={aporte}
                        getNombreUsuario={getNombreUsuario}
                        mostrarComprobante={mostrarComprobante}
                        toggleComprobante={toggleComprobante}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando presupuestos...</p>
          </div>
        ) : Object.keys(presupuestosFiltrados).length === 0 ? (
          busqueda ? (
            <div className="empty-container">
              <div className="empty-icon">🔎</div>
              <h3>No se encontraron resultados</h3>
              <p>No hay presupuestos que coincidan con "{busqueda}"</p>
              <button 
                className="reset-search-button"
                onClick={() => setBusqueda('')}
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="empty-container">
              <div className="empty-icon">💼</div>
              <h3>No hay presupuestos creados</h3>
              <p>¡Comienza a organizar tus finanzas familiares creando tu primer presupuesto!</p>
              <button 
                className="crear-first-button"
                onClick={() => setMostrarFormulario(true)}
              >
                <span className="button-icon">+</span> Crear mi primer presupuesto
              </button>
            </div>
          )
        ) : (
          <div className="presupuestos-container animate-in">
            {Object.keys(presupuestosFiltrados).map(userId => {
              // Obtener el nombre del usuario o mostrar "Usuario desconocido"
              const usuario = usuarios.find(u => u.uid === userId) || 
                             { displayName: 'Usuario desconocido' };
              
              // Agrupar presupuestos por año
              const presupuestosPorAño = {};
              presupuestosFiltrados[userId].forEach(presupuesto => {
                const [año, mes] = presupuesto.mes.split('-');
                if (!presupuestosPorAño[año]) {
                  presupuestosPorAño[año] = [];
                }
                presupuestosPorAño[año].push(presupuesto);
              });
              
              return (
                <div key={userId} className="presupuestos-usuario-grupo">
                  <h3 className="usuario-titulo">
                    {userId === currentUser.uid ? 'Mis presupuestos' : `Presupuestos de ${usuario.displayName}`}
                  </h3>
                  
                  {Object.keys(presupuestosPorAño)
                    .sort((a, b) => b.localeCompare(a)) // Ordenar años descendente
                    .map(año => (
                      <div key={año} className="presupuestos-año-grupo">
                        <h4 className="año-titulo">{año}</h4>
                        <div className="presupuestos-list">
                          {presupuestosPorAño[año].map(presupuesto => (
                            <PresupuestoCard
                              key={presupuesto.id}
                              presupuesto={presupuesto}
                              onClick={handleSelectPresupuesto}
                              formatoMes={formatoMes}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Presupuesto;
