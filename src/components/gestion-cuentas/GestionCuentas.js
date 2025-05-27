import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../NavBar';
import { useAuth } from '../../contexts/AuthContext';
import GestionCuentasHeader from './GestionCuentasHeader';
import GestionCuentasFiltros from './GestionCuentasFiltros';
import GestionCuentasListado from './GestionCuentasListado';
import GestionCuentasForm from './GestionCuentasForm';
import GestionCuentasDetalle from './GestionCuentasDetalle';
import Modal from '../Modal';
import PagoForm from '../PagoForm';
import { getPresupuestos } from '../../services/presupuesto';
import './GestionCuentas.css';
import { procesarCuentasYPagosHistorial } from '../../utils/historialUtils';

const estadoInicialFormulario = {
  monto: '',
  fechaEmision: '',
  fechaVencimiento: '',
  categoria: '',
  descripcion: '',
  proveedor: '',
};

const API_BASE_URL = 'http://localhost:8000/api';

const GestionCuentas = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [cuentas, setCuentas] = useState([]);
  const [filteredCuentas, setFilteredCuentas] = useState([]);
  const [formData, setFormData] = useState(estadoInicialFormulario);
  const [facturaFile, setFacturaFile] = useState(null);
  const [eliminarFactura, setEliminarFactura] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [pagoInfo, setPagoInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState('fechaCreacion');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [detalleError, setDetalleError] = useState(null);

  // Estados para modal de pago desde tarjetas
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [cuentaParaPago, setCuentaParaPago] = useState(null);
  const [presupuestosDisponibles, setPresupuestosDisponibles] = useState([]);

  useEffect(() => {
    setCategorias(['Luz', 'Agua', 'Gas', 'Internet', 'Arriendo', 'Gasto Común', 'Otros']);
  }, []);

  const fetchAPI = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('access');
    if (!token) {
      throw new Error('No autenticado');
    }

    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
    };

    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: response.statusText };
      }
      console.error("API Error Response:", errorData);
      const message = errorData.detail || errorData.message || JSON.stringify(errorData);
      throw new Error(`Error ${response.status}: ${message}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, []);

  const cargarCuentas = useCallback(async () => {
    if (authLoading || !currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const [cuentasData, pagosData] = await Promise.all([
        fetchAPI(`${API_BASE_URL}/cuentas/`),
        fetchAPI(`${API_BASE_URL}/pagos/`)
      ]);
      const cuentasProcesadas = procesarCuentasYPagosHistorial(
        Array.isArray(cuentasData) ? cuentasData : [],
        Array.isArray(pagosData) ? pagosData : []
      );
      setCuentas(cuentasProcesadas);
    } catch (err) {
      console.error("Error cargando cuentas o pagos:", err);
      setError(`No se pudieron cargar las cuentas: ${err.message}`);
      setCuentas([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading, fetchAPI]);

  useEffect(() => {
    cargarCuentas();
  }, [cargarCuentas]);

  useEffect(() => {
    let resultado = [...cuentas];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      resultado = resultado.filter(cuenta =>
        (cuenta.nombre && cuenta.nombre.toLowerCase().includes(lowerSearchTerm)) ||
        (cuenta.categoria && cuenta.categoria.toLowerCase().includes(lowerSearchTerm)) ||
        (cuenta.descripcion && cuenta.descripcion.toLowerCase().includes(lowerSearchTerm))
      );
    }

    resultado.sort((a, b) => {
      let valA = a[sortCriteria];
      let valB = b[sortCriteria];

      if (sortCriteria.startsWith('fecha')) {
        valA = valA ? new Date(valA).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
        valB = valB ? new Date(valB).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
      } else if (sortCriteria === 'monto') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredCuentas(resultado);
  }, [cuentas, searchTerm, sortCriteria, sortDirection]);

  const cargarProveedoresPorCategoria = useCallback(async (categoria) => {
    if (!categoria) {
      setProveedores([]);
      return;
    }
    try {
      const data = await fetchAPI(`${API_BASE_URL}/proveedores-por-categoria/?categoria=${encodeURIComponent(categoria)}`);
      setProveedores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando proveedores:", err);
      setFormError(`No se pudieron cargar proveedores para ${categoria}: ${err.message}`);
      setProveedores([]);
    }
  }, [fetchAPI]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const newState = { ...prev, [name]: val };
      if (name === 'categoria') {
        newState.proveedor = '';
        cargarProveedoresPorCategoria(val);
      }
      return newState;
    });
    setFormError(null);
  }, [cargarProveedoresPorCategoria]);

  const handleFileChange = (e) => {
    setFacturaFile(e.target.files[0] || null);
    setFormError(null);
  };

  const handleEliminarFacturaChange = (e) => {
    setEliminarFactura(e.target.checked);
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleSortChange = (e) => setSortCriteria(e.target.value);
  const toggleSortDirection = () => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');

  const limpiarFormulario = () => {
    setFormData(estadoInicialFormulario);
    setFacturaFile(null);
    setEliminarFactura(false);
    setProveedores([]);
    setFormError(null);
  };

  const handleAbrirFormularioNuevo = () => {
    limpiarFormulario();
    setCuentaSeleccionada(null);
    setShowDetalleModal(false);
    setShowForm(true);
  };

  const handleAbrirPanelDetalle = useCallback((cuenta) => {
    setFormError(null);
    setDetalleError(null);
    setCuentaSeleccionada(cuenta);
    setShowDetalleModal(true);
    setShowForm(false);
    limpiarFormulario();
  }, []);

  const handleCancelar = () => {
    setShowForm(false);
    setShowDetalleModal(false);
    setCuentaSeleccionada(null);
    setPagoInfo(null);
    limpiarFormulario();
    setDetalleError(null);
  };

  const handleEditarDesdeDetalle = useCallback((cuenta) => {
    if (!cuenta) return;

    const formatInputDate = (isoDate) => isoDate ? isoDate.split('T')[0] : '';

    setFormData({
      id: cuenta.id,
      monto: cuenta.monto || '',
      fechaEmision: formatInputDate(cuenta.fecha_emision),
      fechaVencimiento: formatInputDate(cuenta.fecha_vencimiento),
      categoria: cuenta.categoria || '',
      descripcion: cuenta.descripcion || '',
      proveedor: cuenta.proveedor || '',
    });

    if (cuenta.categoria) {
      cargarProveedoresPorCategoria(cuenta.categoria);
    } else {
      setProveedores([]);
    }

    setFacturaFile(null);
    setEliminarFactura(false);

    setShowDetalleModal(false);
    setShowForm(true);
    setCuentaSeleccionada(cuenta);
    setFormError(null);
  }, [cargarProveedoresPorCategoria]);

  const handleGuardarCuenta = async () => {
    if (!currentUser?.id) {
      setFormError("Usuario no autenticado correctamente.");
      return;
    }

    if (!formData.categoria || !formData.monto || !formData.fechaVencimiento || !formData.proveedor) {
      setFormError("Por favor completa Categoría, Proveedor, Monto y Fecha de Vencimiento.");
      return;
    }
    if (isNaN(parseFloat(formData.monto)) || parseFloat(formData.monto) <= 0) {
      setFormError('El monto debe ser un número positivo.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const dataPayload = new FormData();

    dataPayload.append('monto', parseFloat(formData.monto));
    dataPayload.append('fecha_vencimiento', formData.fechaVencimiento);
    dataPayload.append('categoria', formData.categoria);
    dataPayload.append('proveedor', formData.proveedor);
    dataPayload.append('creador', currentUser.id);

    if (formData.fechaEmision) {
      dataPayload.append('fecha_emision', formData.fechaEmision);
    } else {
      dataPayload.append('fecha_emision', '');
    }
    if (formData.descripcion) {
      dataPayload.append('descripcion', formData.descripcion.trim());
    } else {
      dataPayload.append('descripcion', '');
    }

    if (facturaFile) {
      dataPayload.append('factura', facturaFile);
    } else if (eliminarFactura && formData.id) {
      dataPayload.append('eliminar_factura', 'true');
    }

    const isEditing = !!formData.id;
    const url = isEditing ? `${API_BASE_URL}/cuentas/${formData.id}/` : `${API_BASE_URL}/cuentas/`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      await fetchAPI(url, { method: method, body: dataPayload });
      setShowForm(false);
      limpiarFormulario();
      setCuentaSeleccionada(null);
      await cargarCuentas();
    } catch (err) {
      console.error("Error guardando cuenta:", err);
      setFormError(`Error al guardar: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEliminarCuenta = useCallback(async (cuentaId) => {
    if (!currentUser?.id) {
      setError("Usuario no autenticado.");
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar esta cuenta?')) {
      setLoading(true);
      setError(null);
      try {
        await fetchAPI(`${API_BASE_URL}/cuentas/${cuentaId}/`, { method: 'DELETE' });
        await cargarCuentas();
        if (cuentaSeleccionada?.id === cuentaId) {
          handleCancelar();
        }
      } catch (err) {
        console.error("Error eliminando cuenta:", err);
        setError(`Error al eliminar: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  }, [currentUser, fetchAPI, cargarCuentas, cuentaSeleccionada?.id, handleCancelar]);

  // Funciones para modal de pago desde tarjetas
  const cargarPresupuestosDisponibles = useCallback(async () => {
    try {
      const res = await getPresupuestos();
      setPresupuestosDisponibles(res.data || []);
    } catch (err) {
      console.error("Error cargando presupuestos:", err);
      setPresupuestosDisponibles([]);
    }
  }, []);

  const handleAbrirPagoDesdeTarjeta = useCallback(async (cuenta) => {
    setCuentaParaPago(cuenta);
    setShowPagoModal(true);
    await cargarPresupuestosDisponibles();
  }, [cargarPresupuestosDisponibles]);

  const handleCerrarModalPago = useCallback(() => {
    setShowPagoModal(false);
    setCuentaParaPago(null);
    setPresupuestosDisponibles([]);
  }, []);

  const handlePagoRegistradoDesdeTarjeta = useCallback(async () => {
    handleCerrarModalPago();
    await cargarCuentas();
  }, [handleCerrarModalPago, cargarCuentas]);

  const recargarPagosCuentaSeleccionada = useCallback(async () => {
    if (!cuentaSeleccionada?.id) return;
    setDetailLoading(true);
    setPagoInfo(null);
    setDetalleError(null);
    try {
      const pagosData = await fetchAPI(`${API_BASE_URL}/pagos/?cuenta=${cuentaSeleccionada.id}`);
      setPagoInfo(Array.isArray(pagosData) ? pagosData : []);
    } catch (err) {
      setDetalleError(`No se pudo obtener la información de pagos: ${err.message}`);
      setPagoInfo([]);
    } finally {
      setDetailLoading(false);
    }
  }, [cuentaSeleccionada, fetchAPI]);

  useEffect(() => {
    if (showDetalleModal && cuentaSeleccionada?.id) {
      recargarPagosCuentaSeleccionada();
    }
  }, [showDetalleModal, cuentaSeleccionada, recargarPagosCuentaSeleccionada]);

  // --- NUEVO: cerrar modal y recargar cuentas al registrar pago ---
  const handlePagoRegistrado = useCallback(async () => {
    await cargarCuentas();
    setShowDetalleModal(false);
    setCuentaSeleccionada(null);
    setPagoInfo(null);
  }, [cargarCuentas]);

  if (authLoading) {
    return <div>Cargando autenticación...</div>;
  }

  return (
    <div className="gestion-cuentas-page">
      <NavBar />
      <div className="gestion-cuentas-container main-content-area">
        <div style={{flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:24}}>
          {/* Encabezado y botón */}
          <GestionCuentasHeader onAbrirFormularioNuevo={handleAbrirFormularioNuevo} />

          {/* Filtros y búsqueda */}
          <GestionCuentasFiltros
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            sortCriteria={sortCriteria}
            onSortChange={handleSortChange}
            sortDirection={sortDirection}
            onToggleSortDirection={toggleSortDirection}
          />

          {/* Tabla/cuadrícula de cuentas */}
          <div className={`main-content-gc ${showForm || showDetalleModal ? 'panel-visible' : ''}`}> 
            <div className="cuentas-list-area">
              {!currentUser && !loading && <p className="error-message">Debes iniciar sesión.</p>}
              {error && <p className="error-message">{error}</p>}
              <GestionCuentasListado
                loading={loading}
                cuentas={filteredCuentas}
                onAbrirPanel={handleAbrirPanelDetalle}
                onEliminarCuenta={handleEliminarCuenta}
                onAbrirPagoDesdeTarjeta={handleAbrirPagoDesdeTarjeta}
              />
            </div>
            {showDetalleModal && cuentaSeleccionada && (
              <Modal onClose={handleCancelar}>
                <GestionCuentasDetalle
                  cuenta={cuentaSeleccionada}
                  pagoInfo={pagoInfo}
                  loadingPagoInfo={detailLoading}
                  onCancelar={handleCancelar}
                  onEditarCuenta={() => handleEditarDesdeDetalle(cuentaSeleccionada)}
                  error={detalleError}
                  onPagoRegistrado={handlePagoRegistrado}
                  esModal
                />
              </Modal>
            )}
            {showForm && (
              <Modal onClose={handleCancelar}>
                <GestionCuentasForm
                  formData={formData}
                  onInputChange={handleInputChange}
                  onFileChange={handleFileChange}
                  onEliminarFacturaChange={handleEliminarFacturaChange}
                  onGuardarCuenta={handleGuardarCuenta}
                  onCancelar={handleCancelar}
                  categorias={categorias}
                  proveedores={proveedores}
                  formLoading={formLoading}
                  error={formError}
                  isEditing={!!formData.id}
                  cuentaActual={cuentaSeleccionada}
                />
              </Modal>
            )}
            {showPagoModal && cuentaParaPago && (
              <Modal onClose={handleCerrarModalPago}>
                <PagoForm
                  cuenta={cuentaParaPago}
                  onSuccess={handlePagoRegistradoDesdeTarjeta}
                  onCancel={handleCerrarModalPago}
                  presupuestosDisponibles={presupuestosDisponibles}
                />
              </Modal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionCuentas;