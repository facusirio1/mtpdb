import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler } from './api.js';
import { ROLES } from './lib.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem('mtp.token');
      setUser(null);
      nav('/login');
    });
    const token = localStorage.getItem('mtp.token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => setUser(r.user))
      .catch(() => localStorage.removeItem('mtp.token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('mtp.token', r.token);
    setUser(r.user);
    return r.user;
  }

  async function register(payload) {
    // CORRECCIÓN: Se esparcen las propiedades del payload para evitar el anidamiento erróneo en api.js
    const r = await api.post('/auth/register', { ...payload });
    localStorage.setItem('mtp.token', r.token);
    setUser(r.user);
    return r.user;
  }

  function logout() {
    localStorage.removeItem('mtp.token');
    setUser(null);
    nav('/');
  }

  function roleHome() {
    return user ? (ROLES[user.role]?.home || '/u') : '/login';
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, roleHome, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
