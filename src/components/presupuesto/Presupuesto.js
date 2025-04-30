import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../NavBar';
import PresupuestoHistorialSelector from './PresupuestoHistorialSelector';
import PresupuestoResumen from './PresupuestoResumen';
import PresupuestoGraficos from './PresupuestoGraficos';
import PresupuestoAportesPorUsuario from './PresupuestoAportesPorUsuario';
import PresupuestoAportesLista from './PresupuestoAportesLista';
import PresupuestoAporteForm from './PresupuestoAporteForm';
import PresupuestoExportar from './PresupuestoExportar';
import { useAuth } from '../../contexts/AuthContext';
import './Presupuesto.css';

const Presupuesto = () => {
  const { currentUser, familyId } = useAuth();

  const getMesActual = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  };

  const [mesSeleccionado, setMesSeleccionado] = useState(getMesActual());
  const [presupuesto, setPresupuesto] = useState(null);
  const [aportes, setAportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formAporteData, setFormAporteData] = useState({ monto: '', aportadorNombre: currentUser?.displayName || '' });
  const [formLoading, setFormLoading] = useState(false);
  const [aporteEditando, setAporteEditando] = useState(null);
  const [aportesPorUsuario, setAportesPorUsuario] = useState({});

  useEffect(() => {
    const mesActual = getMesActual();
    if (mesSeleccionado !== mesActual) {
      setMesSeleccionado(mesActual);
    }
    // eslint-disable-next-line
  }, []);

  const cargarDatos = useCallback(async () => {
    if (!currentUser || !familyId || !mesSeleccionado) {
      setLoading(false);
      setError(currentUser ? 'ID de familia no disponible.' : 'Usuario no autenticado.');
      return;
    }

    setLoading(true);
    setError('');
    setPresupuesto(null);
    setAportes([]);

    try {
      // TODO: Reemplazar toda la lógica de Firebase RTDB por fetch/axios a la API Django
    } catch (err) {
      console.error("Error cargando datos de presupuesto:", err);
      setError("No se pudieron cargar los datos del presupuesto: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, familyId, mesSeleccionado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    // Calcular aportes por usuario cuando cambien los aportes
    const resumen = {};
    aportes.forEach(aporte => {
      const nombre = aporte.aportadorNombre || 'Sin nombre';
      if (!resumen[nombre]) resumen[nombre] = 0;
      resumen[nombre] += aporte.monto || 0;
    });
    setAportesPorUsuario(resumen);
  }, [aportes]);

  const handleAgregarAporte = async (data) => {
    // data: { monto, aportadorNombre }
    if (!currentUser || !familyId || !presupuesto || !data.monto || !data.aportadorNombre) {
      setError("Faltan datos para agregar el aporte.");
      return;
    }
    setFormLoading(true);
    setError('');

    const nuevoAporte = {
      presupuestoId: presupuesto.id,
      monto: parseFloat(data.monto),
      aportadorNombre: data.aportadorNombre,
      fechaAporte: new Date().toISOString(),
      tipo: 'manual',
    };

    try {
      // TODO: Reemplazar toda la lógica de Firebase RTDB por fetch/axios a la API Django
      setFormAporteData({ monto: '', aportadorNombre: currentUser.displayName || '' });
      await cargarDatos();
    } catch (err) {
      console.error("Error agregando aporte:", err);
      setError("Error al agregar el aporte: " + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEliminarAporte = async (aporte) => {
    if (!window.confirm('¿Seguro que deseas eliminar este aporte?')) return;
    try {
      // TODO: Reemplazar toda la lógica de Firebase RTDB por fetch/axios a la API Django
      await cargarDatos();
    } catch (err) {
      setError('Error al eliminar el aporte: ' + err.message);
    }
  };

  const handleEditarAporte = (aporte) => {
    setAporteEditando(aporte);
  };

  const handleGuardarEdicionAporte = async (data) => {
    if (!aporteEditando) return;
    setFormLoading(true);
    setError('');
    try {
      // TODO: Reemplazar toda la lógica de Firebase RTDB por fetch/axios a la API Django
      setAporteEditando(null);
      await cargarDatos();
    } catch (err) {
      setError('Error al editar el aporte: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const totalAportado = aportes.reduce((sum, a) => sum + a.monto, 0);
  const montoObjetivo = presupuesto?.montoObjetivo || 0;
  const restante = Math.max(0, montoObjetivo - totalAportado);
  const progreso = montoObjetivo > 0 ? Math.min((totalAportado / montoObjetivo) * 100, 100) : 0;

  const datosGraficos = {
    totalAportado,
    montoObjetivo,
    restante,
    progreso,
  };

  if (loading) {
    return (
      <div className="presupuesto-page">
        <NavBar />
        <div className="presupuesto-container loading">Cargando presupuesto...</div>
      </div>
    );
  }

  return (
    <div className="presupuesto-page">
      <NavBar />
      <div className="presupuesto-container">
        <PresupuestoHistorialSelector
          mesSeleccionado={mesSeleccionado}
          onMesChange={setMesSeleccionado}
        />

        <PresupuestoResumen
          presupuesto={presupuesto}
          totalAportado={totalAportado}
          restante={restante}
          progreso={progreso}
        />

        <PresupuestoGraficos
          datos={datosGraficos}
          aportesPorUsuario={aportesPorUsuario} // Pasar el resumen calculado
        />

        <PresupuestoAportesPorUsuario
          aportesPorUsuario={aportesPorUsuario} // Pasar el resumen calculado
        />

        <PresupuestoAportesLista
          aportes={aportes}
          onEditar={handleEditarAporte}
          onEliminar={handleEliminarAporte}
        />

        {aporteEditando && (
          <PresupuestoAporteForm
            onSubmit={handleGuardarEdicionAporte}
            formLoading={formLoading}
            error={error}
            initialData={{
              monto: aporteEditando.monto,
              aportadorNombre: aporteEditando.aportadorNombre
            }}
          />
        )}

        <PresupuestoAporteForm
          onSubmit={handleAgregarAporte}
          formLoading={formLoading}
          error={error}
          initialData={{ monto: '', aportadorNombre: currentUser?.displayName || '' }}
        />

        <PresupuestoExportar
          datos={aportes}
        />
      </div>
    </div>
  );
};

export default Presupuesto;
