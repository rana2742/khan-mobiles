import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until the initial /me check resolves

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const data = await api.post('/api/auth/register', { name, email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const data = await api.post('/api/auth/google', { credential });
    setUser(data.user);
    return data.user;
  }, []);

 const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const resendVerification = useCallback(async () => {
    return api.post('/api/auth/resend-verification');
  }, []);

 const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    loginWithGoogle,
    logout,
    resendVerification,
    refreshUser,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;
