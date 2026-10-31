import { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthApi, getAdminUser, clearSession } from '../utils/api';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthApi.hasSession());
  const [admin, setAdmin] = useState(() => getAdminUser());

  const [loading, setLoading] = useState(true);

  // Supabase restores its session; roles are always checked in the database.
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
    const changed = () => { adminAuthApi.getMe().then(me=>{setAdmin(me);setIsAuthenticated(true);}).catch(()=>{setAdmin(null);setIsAuthenticated(false);}); };
    window.addEventListener('nobelle-session-expired', expired);
    window.addEventListener('nobelle-session-changed', changed);
    window.addEventListener('focus', changed);
    return () => {window.removeEventListener('nobelle-session-expired', expired);window.removeEventListener('nobelle-session-changed', changed);window.removeEventListener('focus', changed);};
  }, []);

  const login = async (email, password, remember = false) => {
    const data = await adminAuthApi.login(email, password, remember);
    setIsAuthenticated(true);
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = async () => {
    await adminAuthApi.logout();
    clearSession();
    setIsAuthenticated(false);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, admin, login, logout, loading, refreshAdmin: async () => { const me = await adminAuthApi.getMe(); setAdmin(me); return me; } }}>
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
