import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../lib/authService';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return undefined;
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const session = await authService.login(email, password);
      if (session.token) {
        setUser(session.user);
      }
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (email, otp) => {
    setIsLoading(true);
    try {
      const session = await authService.verifyTwoFactor(email, otp);
      setUser(session.user);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, fullName) => {
    setIsLoading(true);
    try {
      return await authService.register(email, password, fullName);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email) => {
    return authService.resetPassword(email);
  };

  const completePasswordReset = async (token, password) => {
    return authService.completePasswordReset(token, password);
  };

  const updateProfile = async (profile) => {
    const updated = await authService.updateProfile(profile);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verifyTwoFactor, register, logout, resetPassword, completePasswordReset, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
