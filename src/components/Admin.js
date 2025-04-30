import React, { useState, useEffect, useCallback } from 'react';
import NavBar from './NavBar';
import { useAuth } from '../contexts/AuthContext';
import './Admin.css'; // Crearemos este archivo CSS

const Admin = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingRole, setUpdatingRole] = useState(null); // Para mostrar feedback

  // Cargar usuarios desde la API Django
  const cargarUsuarios = useCallback(async () => {
    // Solo admins pueden cargar usuarios
    if (!currentUser?.isAdmin) {
      setError('Acceso denegado. Debes ser administrador.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // TODO: Reemplazar lógica por llamada a la API Django
      const response = await fetch('/api/usuarios'); // Ejemplo de endpoint
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        setUsers([]);
        throw new Error('Error al cargar usuarios');
      }
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setError("No se pudieron cargar los usuarios: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.isAdmin]); // Depende de si el usuario es admin

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Manejar eliminación de perfil de usuario
  const handleDeleteUser = async (uidToDelete, displayName) => {
    if (!currentUser?.isAdmin) {
      setError('Acción no permitida.');
      return;
    }
    // Prevenir que un admin se elimine a sí mismo desde esta interfaz
    if (currentUser.uid === uidToDelete) {
      setError('No puedes eliminar tu propia cuenta desde aquí.');
      return;
    }

    if (window.confirm(`¿Estás seguro de que quieres eliminar el perfil de "${displayName}" (${uidToDelete}) de la base de datos? Esta acción solo elimina el perfil, no la cuenta de autenticación.`)) {
      setError('');
      try {
        // TODO: Reemplazar lógica por llamada a la API Django
        const response = await fetch(`/api/usuarios/${uidToDelete}`, { method: 'DELETE' });
        if (response.ok) {
          console.log(`Perfil de usuario ${uidToDelete} eliminado.`);
          // Recargar la lista de usuarios
          await cargarUsuarios();
        } else {
          throw new Error('Error al eliminar el perfil');
        }
      } catch (err) {
        console.error("Error eliminando perfil de usuario:", err);
        setError(`Error al eliminar el perfil: ${err.message}`);
      }
    }
  };

  // --- Nueva Función: Cambiar Rol Admin ---
  const handleToggleAdmin = async (uidToToggle, currentIsAdmin) => {
    if (!currentUser?.isAdmin) {
      setError('Acción no permitida.');
      return;
    }
    // Prevenir que un admin se quite el rol a sí mismo desde esta interfaz
    if (currentUser.uid === uidToToggle) {
      setError('No puedes cambiar tu propio rol desde aquí.');
      return;
    }

    const newIsAdminStatus = !currentIsAdmin;
    const actionText = newIsAdminStatus ? 'asignar como administrador' : 'quitar como administrador';
    const userToUpdate = users.find(u => u.uid === uidToToggle);

    if (window.confirm(`¿Estás seguro de que quieres ${actionText} a "${userToUpdate?.displayName || uidToToggle}"?`)) {
      setUpdatingRole(uidToToggle); // Indicar que se está actualizando este usuario
      setError('');
      try {
        // TODO: Reemplazar lógica por llamada a la API Django
        const response = await fetch(`/api/usuarios/${uidToToggle}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAdmin: newIsAdminStatus })
        });
        if (response.ok) {
          console.log(`Rol de admin para ${uidToToggle} actualizado a ${newIsAdminStatus}.`);
          // Recargar la lista para reflejar el cambio
          await cargarUsuarios();
        } else {
          throw new Error('Error al actualizar el rol');
        }
      } catch (err) {
        console.error("Error actualizando rol de admin:", err);
        setError(`Error al actualizar el rol: ${err.message}`);
      } finally {
        setUpdatingRole(null); // Terminar indicación de actualización
      }
    }
  };
  // --- Fin Nueva Función ---

  // Renderizado
  if (loading) {
    return (
      <div className="admin-page">
        <NavBar />
        <div className="admin-container loading">Cargando panel de administración...</div>
      </div>
    );
  }

  // Si no es admin (aunque ProtectedRoute debería prevenir esto)
  if (!currentUser?.isAdmin) {
     return (
      <div className="admin-page">
        <NavBar />
        <div className="admin-container error">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <NavBar />
      <div className="admin-container">
        <h2>Panel de Administración</h2>

        {error && <p className="error-message">{error}</p>}

        <div className="user-list-section card">
          <h3>Lista de Usuarios</h3>
          {users.length === 0 ? (
            <p>No se encontraron usuarios.</p>
          ) : (
            <table className="user-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>ID Familia</th>
                  <th>Es Admin</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.uid}>
                    <td>{user.displayName || 'N/A'}</td>
                    <td>{user.email}</td>
                    <td>{user.idDeLaFamilia || 'Ninguna'}</td>
                    <td>{user.isAdmin ? 'Sí' : 'No'}</td>
                    <td>
                      <div className="user-actions">
                        {/* Botón para cambiar rol */}
                        <button
                          className={`btn-toggle-admin ${user.isAdmin ? 'is-admin' : 'is-not-admin'}`}
                          onClick={() => handleToggleAdmin(user.uid, user.isAdmin)}
                          disabled={currentUser.uid === user.uid || updatingRole === user.uid} // Deshabilitar para sí mismo o mientras actualiza
                          title={currentUser.uid === user.uid ? "No puedes cambiar tu propio rol" : (user.isAdmin ? `Quitar rol admin a ${user.displayName}` : `Hacer admin a ${user.displayName}`)}
                        >
                          {updatingRole === user.uid ? 'Cambiando...' : (user.isAdmin ? 'Quitar Admin' : 'Hacer Admin')}
                        </button>
                        {/* Botón de eliminar perfil */}
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user.uid, user.displayName)}
                          disabled={currentUser.uid === user.uid || updatingRole === user.uid} // Deshabilitar para sí mismo o mientras actualiza rol
                          title={currentUser.uid === user.uid ? "No puedes eliminar tu propia cuenta" : `Eliminar perfil de ${user.displayName}`}
                        >
                          Eliminar Perfil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="admin-warning">
            <strong>Nota:</strong> La eliminación desde aquí solo borra el perfil del usuario en la base de datos (nombre, familia, rol), no elimina la cuenta de autenticación. Para eliminar completamente un usuario, se requiere un backend o Cloud Functions.
          </p>
        </div>
        {/* Aquí podrías añadir otras secciones de administración */}
      </div>
    </div>
  );
};

export default Admin;
