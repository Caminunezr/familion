import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // Almacenará { username, id }
  const [groupId, setGroupId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login usando Django JWT
  async function login(username, password) {
    const response = await fetch('http://localhost:8000/api/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      throw new Error('Usuario o contraseña incorrectos');
    }
    const data = await response.json();
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    // Obtener perfil y groupId
    await fetchProfileAndSetUser();
  }

  // Logout
  function logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setCurrentUser(null);
    setGroupId(null);
  }

  // Obtener perfil del usuario autenticado
  async function fetchProfileAndSetUser() {
    const access = localStorage.getItem('access');
    if (!access) {
      setCurrentUser(null);
      setGroupId(null);
      setLoading(false); // Asegurarse de que loading sea false si no hay token
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/api/profile/', {
        headers: { 'Authorization': `Bearer ${access}` }
      });
      if (res.status === 401) {
        logout(); // Si el token no es válido, cerrar sesión
        return;
      }
      if (!res.ok) throw new Error('No se pudo obtener el perfil');
      const profile = await res.json();
      const userId = profile.user_id || profile.user?.id; // Intenta obtener el ID
      const username = profile.user?.username || profile.user; // Intenta obtener el username

      if (userId && username) {
        setCurrentUser({ id: userId, username: username });
        setGroupId(profile.group_id);
      } else {
        console.error("No se pudo obtener userId o username del perfil:", profile);
        logout();
      }
    } catch (err) {
      console.error("Error fetching profile:", err); // Loguear el error
      logout(); // Si hay error, desloguear
    } finally {
      setLoading(false); // Finalizar carga independientemente del resultado
    }
  }

  // Mantener sesión si hay token
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      fetchProfileAndSetUser();
    } else {
      setLoading(false); // Si no hay token, termina la carga inicial
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    currentUser,
    groupId,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
