import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../NavBar';
import { useAuth } from '../../contexts/AuthContext';

// Importa estilos si creas un archivo CSS específico
// import './AdminPage.css';

const AdminPage = () => {
  const { currentUser } = useAuth(); // currentUser ahora debería tener 'isAdmin'
  const [loading, setLoading] = useState(false); // Loading general para acciones
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true); // Estado de carga específico
  const [loadingFamilies, setLoadingFamilies] = useState(true); // Estado de carga específico

  // Cargar usuarios
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError('');
    try {
      // TODO: Reemplazar lógica de Firebase RTDB por llamada a la API Django
      const usersData = {}; // Simulación de datos obtenidos de la API
      setUsers(Object.keys(usersData).map(uid => ({ uid, ...usersData[uid] })));
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setError("No se pudieron cargar los usuarios: " + err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, []); // Sin dependencias externas

  // Cargar familias
  const loadFamilies = useCallback(async () => {
    setLoadingFamilies(true);
    setError(''); // Limpiar error al intentar cargar familias
    try {
      // TODO: Reemplazar lógica de Firebase RTDB por llamada a la API Django
      const familiesData = {}; // Simulación de datos obtenidos de la API
      setFamilies(Object.keys(familiesData));
      if (Object.keys(familiesData).length === 0) {
        setError("No se encontraron familias en la base de datos. Asegúrate de que existan familias en la API.");
      }
    } catch (err) {
      console.error("Error cargando familias:", err);
      setError("No se pudieron cargar las familias: " + err.message);
    } finally {
      setLoadingFamilies(false);
    }
  }, []); // Sin dependencias externas

  // Cargar datos iniciales y verificar permisos de admin
  useEffect(() => {
    // --- Verificación de Admin ---
    if (!currentUser) {
      setError("Debes iniciar sesión para acceder a esta página.");
      setLoadingUsers(false); // Detener carga si no está logueado
      setLoadingFamilies(false);
      return; // Salir temprano
    }
    // Verificar explícitamente true, ya que podría ser undefined inicialmente
    if (currentUser.isAdmin !== true) {
      setError("Acceso denegado. Requiere permisos de administrador.");
      setLoadingUsers(false); // Detener carga si no es admin
      setLoadingFamilies(false);
      return; // Salir temprano
    }
    // --- Fin Verificación ---

    // Si es admin, proceder a cargar datos
    setError(''); // Limpiar errores previos si ahora es admin y puede cargar
    loadUsers();
    loadFamilies();
  }, [currentUser, loadUsers, loadFamilies]); // currentUser es dependencia clave

  // --- Funciones de Administración ---

  const handleChangeUserFamily = async (userId, newFamilyId) => {
    // Validar que el userId exista
    if (!userId) {
        setError("Se requiere ID de usuario.");
        return;
    }

    // Verificar que la familia seleccionada exista (si no es para desasignar)
    // newFamilyId será "" si se selecciona "-- Desasignar --"
    if (newFamilyId && !families.includes(newFamilyId)) {
      setError(`La familia "${newFamilyId}" no existe en la base de datos.`);
      return;
    }

    setLoading(true); // Usar loading general para la operación
    setError(''); // Limpiar error anterior
    try {
      // TODO: Reemplazar lógica de Firebase RTDB por llamada a la API Django
      // Simulación de actualización exitosa
      setUsers(prevUsers => prevUsers.map(u =>
        u.uid === userId ? { ...u, idDeLaFamilia: newFamilyId || null } : u
      ));
      console.log(`Familia actualizada a "${newFamilyId || 'ninguna'}" para usuario ${userId}`);
    } catch (err) {
      console.error("Error al actualizar la familia del usuario:", err);
      setError("Error al actualizar la familia del usuario: " + err.message);
    } finally {
      setLoading(false); // Finalizar estado de carga de la acción
    }
  };

  // --- Renderizado ---
  const isLoading = loadingUsers || loadingFamilies; // Estado de carga combinado para datos iniciales

  // Estilos básicos para la tabla (puedes moverlos a un archivo CSS)
  const tableHeaderStyle = {
    borderBottom: '2px solid #ddd',
    padding: '10px 5px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2'
  };

  const tableCellStyle = {
    borderBottom: '1px solid #eee',
    padding: '8px 5px',
    verticalAlign: 'middle'
  };

  return (
    <div className="admin-page">
      <NavBar />
      <div className="admin-container" style={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
        <h2>Panel de Administración</h2>

        {/* Mostrar mensajes de carga o error */}
        {loading && !isLoading && <p>Actualizando...</p>} {/* Loading para acciones como cambiar familia */}
        {isLoading && <p>Cargando datos de administración...</p>} {/* Loading inicial */}
        {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

        {/* Renderizar contenido principal solo si es admin, no está cargando y no hay error */}
        {!isLoading && !error && currentUser && currentUser.isAdmin === true && (
          <>
            {/* Sección de Usuarios */}
            <section>
              <h3>Usuarios ({users.length})</h3>
              {users.length === 0 && !loadingUsers ? (
                <p>No se encontraron perfiles de usuario.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>UID</th>
                      <th style={tableHeaderStyle}>Nombre</th>
                      <th style={tableHeaderStyle}>Email</th>
                      <th style={tableHeaderStyle}>ID Familia Actual</th>
                      <th style={tableHeaderStyle}>Cambiar Familia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.uid}>
                        {/* Acortar UID para visualización */}
                        <td style={tableCellStyle} title={user.uid}>{user.uid.substring(0, 8)}...</td>
                        <td style={tableCellStyle}>{user.displayName || 'N/A'}</td>
                        <td style={tableCellStyle}>{user.email}</td>
                        {/* Mostrar 'Ninguna' si no tiene familia asignada */}
                        <td style={tableCellStyle}>{user.idDeLaFamilia || <span style={{ fontStyle: 'italic', color: '#888' }}>Ninguna</span>}</td>
                        <td style={tableCellStyle}>
                          <select
                            // Usar null o undefined como valor vacío consistente, mapeado a "" para el select
                            value={user.idDeLaFamilia || ''}
                            onChange={(e) => handleChangeUserFamily(user.uid, e.target.value)}
                            // Deshabilitar si se está actualizando o si no hay familias cargadas
                            disabled={loading || families.length === 0}
                            style={{ padding: '5px', minWidth: '150px' }}
                          >
                            {/* Opción para desasignar familia */}
                            <option value="">-- Desasignar --</option>
                            {/* Mapear familias cargadas a opciones */}
                            {families.map(famId => (
                              <option key={famId} value={famId}>{famId}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Sección de Familias */}
            <section style={{ marginTop: '30px' }}>
              <h3>Familias Existentes ({families.length})</h3>
              {families.length === 0 && !loadingFamilies ? (
                 // Mensaje si no se cargaron familias (puede ser por error o porque no existen)
                 <p>No se encontraron familias. Debes crear al menos una manualmente en la API.</p>
              ) : (
                // Listar las familias encontradas
                <ul>
                  {families.map(famId => (
                    <li key={famId}>{famId}</li>
                  ))}
                </ul>
              )}
              {/* Espacio para futura funcionalidad de crear/eliminar familias */}
              {/* <button disabled={loading}>Crear Nueva Familia</button> */}
            </section>
          </>
        )}

        {/* Mensaje si no está logueado o no es admin (y no hay un error ya mostrado) */}
        {!error && currentUser && currentUser.isAdmin !== true && (
           <p className="error-message" style={{ color: 'orange' }}>No tienes permisos para ver esta página.</p>
        )}
         {!error && !currentUser && !isLoading && (
            <p className="error-message" style={{ color: 'red' }}>Debes iniciar sesión para ver esta página.</p>
         )}
      </div>
    </div>
  );
};

export default AdminPage;
