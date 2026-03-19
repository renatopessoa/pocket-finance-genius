import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextValue {
  currentUser: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  token: null,
  login: () => { },
  logout: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('pfg_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('pfg_token');
    } catch {
      return null;
    }
  });

  const login = useCallback((user: User, tkn: string) => {
    localStorage.setItem('pfg_user', JSON.stringify(user));
    localStorage.setItem('pfg_token', tkn);
    setCurrentUser(user);
    setToken(tkn);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pfg_user');
    localStorage.removeItem('pfg_token');
    setCurrentUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
