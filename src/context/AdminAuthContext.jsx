import { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('nobelle_admin_auth') === 'true';
  });

  const login = (email, password) => {
    // Mock validation: accept any email/password for now
    if (email && password) {
      setIsAuthenticated(true);
      localStorage.setItem('nobelle_admin_auth', 'true');
      localStorage.setItem('nobelle_admin_email', email);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('nobelle_admin_auth');
    localStorage.removeItem('nobelle_admin_email');
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
