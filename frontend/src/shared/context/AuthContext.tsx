import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Perfil, Rol } from '../types/api.js';

interface AuthContextType {
  user: Perfil | null;
  token: string | null;
  role: Rol | null;
  isAuthenticated: boolean;
  login: (token: string, user: Perfil) => void;
  logout: () => void;
  actualizarUsuario: (user: Perfil) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Perfil | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // Sincronizar el atributo data-role en <html> para que el Design System aplique los colores
  useEffect(() => {
    const roleAttr = user?.rol ? user.rol.toLowerCase() : 'admin';
    document.documentElement.setAttribute('data-role', roleAttr);
  }, [user]);

  const login = (newToken: string, newUser: Perfil) => {
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

  const actualizarUsuario = (updatedUser: Perfil) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
        actualizarUsuario,
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
