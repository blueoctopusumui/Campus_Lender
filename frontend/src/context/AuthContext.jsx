// CampusLend Auth Context
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalize user object so role is always a plain string ('ADMIN' | 'STAFF' | 'STUDENT')
  const setUser = useCallback((userData) => {
    if (!userData) {
      setUserState(null);
      return;
    }
    const roleString =
      typeof userData.role === 'object' && userData.role !== null
        ? userData.role.roleName
        : userData.role;

    setUserState({ ...userData, role: roleString });
  }, []);

  // Check session by calling /auth/me (relies on httpOnly cookie — no localStorage)
  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data);
      } else {
        setUserState(null);
      }
    } catch {
      // 401 = not logged in; that is expected and normal
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      // Ask the backend to clear the httpOnly cookie
      await api.post('/auth/logout');
    } catch {
      // Even if the request fails, clear local state
    } finally {
      setUserState(null);
      // Hard-navigate so the browser discards all in-memory state
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
