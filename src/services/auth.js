// src/services/auth.js
export async function loginDjango(username, password) {
  const response = await fetch('http://localhost:8000/api/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error('Credenciales inválidas');
  }
  return response.json(); // { access: '...', refresh: '...' }
}