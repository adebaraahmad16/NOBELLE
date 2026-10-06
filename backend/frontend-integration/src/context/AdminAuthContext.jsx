import { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthApi, getAdminUser, clearSession } from '../utils/api';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthApi.hasSession());
  const [admin, setAdmin] = useState(() => getAdminUser());

  const [loading, setLoading] = useState(true);

  // Re-verify session against the backend on mount if a token exists
  useEffect(() => {

    let cancelled = false;
    adminAuthApi
      .getMe()
      .then((me) => {
        if (!cancelled) { setAdmin(me); setIsAuthenticated(true); }
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          setIsAuthenticated(false);
          setAdmin(null);
        }
      }).finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const expired = e => { if (e.detail === 'admin') { clearSession(); setIsAuthenticated(false); setAdmin(null); } };
    window.addEventListener('nobelle-session-expired', expired);
    return () => window.removeEventListener('nobelle-session-expired', expired);
  }, []);

  const login = async (email, password, remember = false) => {
    const data = await adminAuthApi.login(email, password, remember);
    setIsAuthenticated(true);
    setAdmin(data.admin);
    return true;
  };

  const logout = async () => {
    await adminAuthApi.logout();
    clearSession();
    setIsAuthenticated(false);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, admin, login, logout, loading }}>
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
