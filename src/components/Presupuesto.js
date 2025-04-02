import React, { useState, useEffect } from 'react';
import NavBar from './NavBar';
import { useAuth } from '../contexts/AuthContext';
import db, { resetDatabase } from '../utils/database';
import { saveFile } from '../utils/fileStorage';
import FileViewer from './FileViewer';
import './Presupuesto.css';
import { migratePresupuestos } from '../utils/dataMigration';

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
  }, [currentUser]);

  useEffect(() => {
    const fetchAportes = async () => {
      if (!selectedPresupuesto) return;
      
      try {
        const aportesData = await db.aportes
          .where('presupuestoId')
          .equals(selectedPresupuesto.id)
          .toArray();
        
        setAportes(aportesData);
      } catch (error) {
        console.error('Error al cargar aportes:', error);
      }
    };
    
    fetchAportes();
  }, [selectedPresupuesto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAporteChange = (e) => {
    const { name, value } = e.target;
    setFormAporte({
      ...formAporte,
      [name]: value
    });
  };
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setComprobante(e.target.files[0]);
    }
  };

  // Función para eliminar un presupuesto
  const handleDeletePresupuesto = async () => {
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
        
        // Recargar la lista de presupuestos
        const presupuestosData = await db.presupuestos.toArray();
        
        // Agrupar presupuestos por usuario creador
        const presupuestosPorUsuario = {};
        
        presupuestosData.forEach(presupuesto => {
          const creadorId = presupuesto.creadorId || 'desconocido';
          
          if (!presupuestosPorUsuario[creadorId]) {
            presupuestosPorUsuario[creadorId] = [];
          }
          
          presupuestosPorUsuario[creadorId].push(presupuesto);
        });
        
        // Ordenar presupuestos por mes
        Object.keys(presupuestosPorUsuario).forEach(userId => {
          presupuestosPorUsuario[userId].sort((a, b) => b.mes.localeCompare(a.mes));
        });
        
        setPresupuestos(presupuestosPorUsuario);
        setError('');
      } catch (error) {
        console.error('Error al eliminar presupuesto:', error);
        setError('Error al eliminar el presupuesto');
      }
    }
  };

  const handleSubmit = async (e) => {
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
      
      const id = await db.presupuestos.add(presupuestoData);
      
      // Recargar la lista de presupuestos para mostrar el nuevo
      const presupuestosData = await db.presupuestos.toArray();
      
      // Agrupar presupuestos por usuario creador
      const presupuestosPorUsuario = {};
      
      presupuestosData.forEach(presupuesto => {
        const creadorId = presupuesto.creadorId || 'desconocido';
        
        if (!presupuestosPorUsuario[creadorId]) {
          presupuestosPorUsuario[creadorId] = [];
        }
        
        presupuestosPorUsuario[creadorId].push(presupuesto);
      });
      
      // Ordenar presupuestos por mes
      Object.keys(presupuestosPorUsuario).forEach(userId => {
        presupuestosPorUsuario[userId].sort((a, b) => b.mes.localeCompare(a.mes));
      });
      
      setPresupuestos(presupuestosPorUsuario);
      
      // Resetear el formulario
      setFormData({
        mes: new Date().toISOString().slice(0, 7),
        montoAporte: '150000',
        descripcion: ''
      });
      
      setMostrarFormulario(false);
      setError('');
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      setError('Error al guardar el presupuesto');
    }
  };

  const handleAporteSubmit = async (e) => {
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
      
      const id = await db.aportes.add(aporteData);
      
      // Actualizar la lista de aportes
      setAportes([
        { id, ...aporteData },
        ...aportes
      ]);
      
      // Resetear el formulario
      setFormAporte({
        monto: '',
        fechaAporte: new Date().toISOString().split('T')[0]
      });
      setComprobante(null);
      setMostrarFormularioAporte(false);
      setError('');
    } catch (error) {
      console.error('Error al guardar aporte:', error);
      setError('Error al guardar el aporte');
    }
  };

  const formatoMes = (mesString) => {
    const [año, mes] = mesString.split('-');
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${nombresMeses[parseInt(mes) - 1]} ${año}`;
  };

  const calcularTotalAportado = () => {
    // Si es un presupuesto antiguo, podría tener montoObjetivo en lugar de montoAporte
    if (selectedPresupuesto && !selectedPresupuesto.montoAporte && selectedPresupuesto.montoObjetivo) {
      return selectedPresupuesto.montoObjetivo;
    }
    return aportes.reduce((total, aporte) => total + aporte.monto, 0);
  };

  const getNombreUsuario = (uid) => {
    const usuario = usuarios.find(u => u.uid === uid);
    return usuario ? usuario.displayName : 'Usuario desconocido';
  };

  const handleResetDatabase = async () => {
    if (window.confirm('¿Estás seguro de que quieres resetear la base de datos? Todos los datos se perderán.')) {
      await resetDatabase();
    }
  };

  if (dbError) {
    return (
      <div className="presupuesto-page">
        <NavBar />
        <div className="presupuesto-container">
          <div className="db-error-container">
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
          {!mostrarFormulario && (
            <button 
              className="crear-button"
              onClick={() => setMostrarFormulario(true)}
            >
              Crear Nuevo Presupuesto
            </button>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {mostrarFormulario ? (
          <div className="form-container">
            <h3>Registrar Aporte Mensual</h3>
            <div className="form-info-box">
              <p>El aporte mensual aproximado por persona es de $150,000, aunque puede variar según las cuentas que ya hayas pagado directamente.</p>
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
                  Registrar Aporte
                </button>
              </div>
            </form>
          </div>
        ) : selectedPresupuesto ? (
          <div className="presupuesto-detalle">
            <div className="detalle-header">
              <div className="header-left">
                <button 
                  className="back-button"
                  onClick={() => {
                    setSelectedPresupuesto(null);
                    setMostrarFormularioAporte(false);
                    setMostrarComprobante(null);
                  }}
                >
                  ← Volver
                </button>
              </div>
              <h3>Presupuesto: {formatoMes(selectedPresupuesto.mes)}</h3>
              <div className="header-actions">
                <button 
                  className="delete-presupuesto-button"
                  onClick={handleDeletePresupuesto}
                >
                  <span className="delete-icon">🗑️</span> Eliminar
                </button>
              </div>
            </div>
            
            <div className="presupuesto-info">
              <div className="info-row">
                <span>Aporte Mensual:</span>
                <span className="monto-aporte">
                  ${(selectedPresupuesto.montoAporte || selectedPresupuesto.montoObjetivo).toFixed(2)}
                </span>
              </div>
              
              <div className="info-row">
                <span>Total Aportado:</span>
                <span className="total-aportado">${calcularTotalAportado().toFixed(2)}</span>
                <span className="info-tooltip" title="Incluye aportes directos y pagos de cuentas">ⓘ</span>
              </div>
              
              <div className="info-row">
                <span>Creado por:</span>
                <span className="creador-nombre">{selectedPresupuesto.creadorNombre || 'Usuario'}</span>
              </div>
              
              <div className="progreso-container">
                <div className="progreso-label">
                  Progreso: {((calcularTotalAportado() / (selectedPresupuesto.montoAporte || selectedPresupuesto.montoObjetivo)) * 100).toFixed(0)}% 
                </div>
                <div className="progreso-barra">
                  <div 
                    className="progreso-relleno"
                    style={{ width: `${Math.min((calcularTotalAportado() / (selectedPresupuesto.montoAporte || selectedPresupuesto.montoObjetivo)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {selectedPresupuesto.descripcion && (
                <div className="info-descripcion">
                  <p>{selectedPresupuesto.descripcion}</p>
                </div>
              )}
            </div>
            
            {mostrarFormularioAporte ? (
              <div className="form-container">
                <h3>Registrar Aporte</h3>
                <form onSubmit={handleAporteSubmit} className="aporte-form">
                  <div className="form-group">
                    <label htmlFor="monto">Monto Aportado *</label>
                    <input
                      type="number"
                      id="monto"
                      name="monto"
                      value={formAporte.monto}
                      onChange={handleAporteChange}
                      step="0.01"
                      required
                    />
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
                    <input
                      type="file"
                      id="comprobante"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
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
              <>
                <div className="aportes-header">
                  <h3>Aportes Registrados</h3>
                  <button 
                    className="aporte-button"
                    onClick={() => setMostrarFormularioAporte(true)}
                  >
                    Registrar Aporte
                  </button>
                </div>
                
                {aportes.length === 0 ? (
                  <div className="empty-message">No hay aportes registrados aún</div>
                ) : (
                  <div className="aportes-list">
                    {aportes.map(aporte => (
                      <div key={aporte.id} className={`aporte-card ${aporte.tipoPago === 'cuenta' ? 'aporte-cuenta' : ''}`}>
                        <div className="aporte-info">
                          <div className="aporte-monto">${aporte.monto.toFixed(2)}</div>
                          <div className="aporte-detalles">
                            <div className="aporte-miembro">
                              <strong>Miembro:</strong> {getNombreUsuario(aporte.miembroId)}
                            </div>
                            <div className="aporte-fecha">
                              <strong>Fecha:</strong> {new Date(aporte.fechaAporte).toLocaleDateString('es-ES')}
                            </div>
                            {aporte.tipoPago === 'cuenta' && (
                              <div className="aporte-cuenta-info">
                                <strong>Pago de cuenta:</strong> {aporte.cuentaNombre}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {aporte.rutaComprobante && (
                          <div className="aporte-comprobante">
                            <button 
                              className="ver-comprobante-button"
                              onClick={() => setMostrarComprobante(aporte.rutaComprobante === mostrarComprobante ? null : aporte.rutaComprobante)}
                            >
                              {aporte.rutaComprobante === mostrarComprobante ? 'Ocultar Comprobante' : 'Ver Comprobante'}
                            </button>
                          </div>
                        )}
                        
                        {mostrarComprobante === aporte.rutaComprobante && (
                          <FileViewer filePath={aporte.rutaComprobante} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : loading ? (
          <div className="loading-message">Cargando presupuestos...</div>
        ) : Object.keys(presupuestos).length === 0 ? (
          <div className="empty-message">No hay presupuestos creados. ¡Crea el primero!</div>
        ) : (
          <div className="presupuestos-container">
            {Object.keys(presupuestos).map(userId => {
              // Obtener el nombre del usuario o mostrar "Usuario desconocido"
              const usuario = usuarios.find(u => u.uid === userId) || 
                             { displayName: 'Usuario desconocido' };
              
              // Agrupar presupuestos por año
              const presupuestosPorAño = {};
              presupuestos[userId].forEach(presupuesto => {
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
                            <div 
                              key={presupuesto.id} 
                              className="presupuesto-card"
                              onClick={() => setSelectedPresupuesto(presupuesto)}
                            >
                              <div className="presupuesto-mes">{formatoMes(presupuesto.mes)}</div>
                              <div className="presupuesto-monto">
                                <span>Aporte:</span>
                                <span className="monto-value">
                                  ${(presupuesto.montoAporte || presupuesto.montoObjetivo).toFixed(2)}
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
