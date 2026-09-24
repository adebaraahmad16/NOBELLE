import { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthApi, getAdminUser, clearSession } from '../utils/api';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthApi.hasSession());
  const [admin, setAdmin] = useState(() => getAdminUser());

  // Re-verify session against the backend on mount if a token exists
  useEffect(() => {
    if (!adminAuthApi.hasSession()) return;
    let cancelled = false;
    adminAuthApi
      .getMe()
      .then((me) => {
        if (!cancelled) setAdmin(me);
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          setIsAuthenticated(false);
          setAdmin(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password, remember = false) => {
    const data = await adminAuthApi.login(email, password, remember);
    setIsAuthenticated(true);
    setAdmin(data.admin);
    return true;
  };

  const logout = async () => {
    try {
      await adminAuthApi.logout();
    } catch {
      // session cleared locally regardless
    }
    clearSession();
    setIsAuthenticated(false);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
