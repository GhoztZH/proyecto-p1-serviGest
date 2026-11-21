import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, UserRole } from '../types/common.types';

/**
 * Contexto global de autenticación y rol activo.
 * - Mantiene el usuario logueado en memoria y localStorage.
 * - Sincroniza el atributo data-role en <html> para que el Design System pinte los colores correctos.
 */
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // Sincronizar el atributo data-role con el tag <html> para el Design System
  useEffect(() => {
    const roleAttr = user?.rol ? user.rol.toLowerCase() : 'admin';
    document.documentElement.setAttribute('data-role', roleAttr);
  }, [user]);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.documentElement.setAttribute('data-role', 'admin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.rol ?? null,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return context;
}
