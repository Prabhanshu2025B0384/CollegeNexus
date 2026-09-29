import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  role: string | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = authService.getToken();
    const storedUsername = authService.getUsername();
    const storedRole = localStorage.getItem('role');

    if (token) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      setRole(storedRole);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const response = await authService.login(credentials);
    setIsAuthenticated(true);
    setUsername(response.username);
    setRole(response.role);
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUsername(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        role,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
