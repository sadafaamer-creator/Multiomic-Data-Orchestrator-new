import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
  email: string;
  password: string; // In a real app, this would be hashed
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isAuthenticated') === 'true';
    }
    return false;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isAuthenticated', String(isAuthenticated));
      if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('currentUser');
      }
    }
  }, [isAuthenticated, currentUser]);

  const getUsers = (): User[] => {
    if (typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem('mdo_users');
      return storedUsers ? JSON.parse(storedUsers) : [];
    }
    return [];
  };

  const saveUsers = (users: User[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mdo_users', JSON.stringify(users));
    }
  };

  const register = async (email: string, password: string, username: string): Promise<boolean> => {
    const users = getUsers();
    if (users.some(user => user.email === email)) {
      toast.error('An account with this email already exists.');
      return false;
    }

    const newUser: User = { email, password, username };
    saveUsers([...users, newUser]);
    toast.success('Account created successfully! Please log in.');
    return true;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = getUsers();
    const foundUser = users.find(user => user.email === email && user.password === password);

    if (foundUser) {
      setIsAuthenticated(true);
      setCurrentUser(foundUser);
      toast.success(`Welcome, ${foundUser.username}!`);
      return true;
    } else {
      toast.error('Invalid email or password.');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.info('You have been logged out.');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};